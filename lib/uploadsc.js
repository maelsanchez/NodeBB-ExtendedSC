'use strict';

var path = require('path');
var async = require('async');
var nconf = require('nconf');
var validator = require('validator');
var mkdirp = require('mkdirp');
//var Hashids = require('hashids');

var db = require('../database');
var meta = require('../meta');
var file = require('../file');
var plugins = require('../plugins');
var image = require('../image');
var privileges = require('../privileges');

var UploadSC = module.exports;

UploadSC.init = function (req, res, next) {
	UploadSC.upload(req, res, function (uploadedFile, next) {
		var isImage = uploadedFile.type.match(/image./);
		if (isImage) {
			uploadAsImage(req, uploadedFile, next);
		} else{
			uploadAsFile(req, uploadedFile, next);
		}
	}, next);
};

UploadSC.upload = function (req, res, filesIterator) {
	var files = req.files.files;

	if (!Array.isArray(files)) {
		return res.status(500).json('invalid files');
	}

	if (Array.isArray(files[0])) {
		files = files[0];
	}

	async.mapSeries(files, filesIterator, function (err, images) {
		deleteTempFiles(files);

		if (err) {
			return res.status(500).json({ path: req.path, error: err.message });
		}

		res.status(200).json(images);
	});
};

function uploadAsImage(req, uploadedFile, callback) {
	async.waterfall([
		function (next) {
			privileges.global.can('upload:post:image', req.uid, next);
		},
		function (canUpload, next) {
			if (!canUpload) {
				return next(new Error('[[error:no-privileges]]'));
			}
			image.checkDimensions(uploadedFile.path, next);
		},
		function (next) {
			file.isFileTypeAllowed(uploadedFile.path, next);
		},
		function (next) {
			UploadSC.uploadFile(req.uid, uploadedFile, next);
		},
		function (fileObj, next) {
			if (meta.config.resizeImageWidth === 0 || meta.config.resizeImageWidthThreshold === 0) {
				return next(null, fileObj);
			}

			resizeImage(fileObj, next);
		},
		function (fileObj, next) {
			next(null, { url: fileObj.url });
		},
	], callback);
}

function uploadAsFile(req, uploadedFile, callback) {
	async.waterfall([
		function (next) {
			privileges.global.can('upload:post:file', req.uid, next);
		},
		function (canUpload, next) {
			if (!canUpload) {
				return next(new Error('[[error:no-privileges]]'));
			}
			if (!meta.config.allowFileUploads) {
				return next(new Error('[[error:uploads-are-disabled]]'));
			}
			UploadSC.uploadFile(req.uid, req.body.action, uploadedFile, next);
		},
		function (fileObj, next) {

			next(null, {
				url: fileObj.url,
				name: fileObj.name,
				replay: fileObj.replay,
				replay_error: fileObj.replay_error
			});
		},
	], callback);
}

function resizeImage(fileObj, callback) {
	async.waterfall([
		function (next) {
			image.size(fileObj.path, next);
		},
		function (imageData, next) {
			if (imageData.width < meta.config.resizeImageWidthThreshold || meta.config.resizeImageWidth > meta.config.resizeImageWidthThreshold) {
				return callback(null, fileObj);
			}

			image.resizeImage({
				path: fileObj.path,
				target: file.appendToFileName(fileObj.path, '-resized'),
				width: meta.config.resizeImageWidth,
				quality: meta.config.resizeImageQuality,
			}, next);
		},
		function (next) {
			// Return the resized version to the composer/postData
			fileObj.url = file.appendToFileName(fileObj.url, '-resized');

			next(null, fileObj);
		},
	], callback);
}

UploadSC.Thumbnail = function (fileObj, folder, width, height, next) {
	async.waterfall([
		function (next) {
			var realname = path.basename(fileObj.path),
				uploadPath = path.join(nconf.get('upload_path'), folder, realname);
			mkdirp(path.dirname(uploadPath), function (err) {
				if (err) {
					return callback(err);
				}
				file.copyFile(fileObj.path, uploadPath, function (err) {
					if (err) {
						return callback(err);
					}
		
					callback(null, {
						url: '/assets/uploads/' + (folder ? folder + '/' : '') + realname,
						path: uploadPath,
					});
				});
			});
		},
		function (data, next) {
			image.resizeImage({
				path: data.path,
				width: width,
				height: height,
			}, next);
		},
	], next);
};

UploadSC.uploadFile = function (uid, action, uploadedFile, callback) {
	if (!uploadedFile) {
		return callback(new Error('[[error:invalid-file]]'));
	}

	if (uploadedFile.size > meta.config.maximumFileSize * 1024) {
		return callback(new Error('[[error:file-too-big, ' + meta.config.maximumFileSize + ']]'));
	}
	var allowed = file.allowedExtensions();
	var extension = path.extname(uploadedFile.name).toLowerCase();

	if(action == 'replays') {
		if(extension != '.rec' && extension != '.rcx') {
			return callback(new Error('[[error:invalid-file]]'));
		}
	}
	if (allowed.length > 0 && (!extension || extension === '.' || !allowed.includes(extension))) {
		return callback(new Error('[[error:invalid-file-type, ' + allowed.join('&#44; ') + ']]'));
	}

	saveFileToLocal(uid, action, uploadedFile, callback);
};

function saveFileToLocal(uid, action, uploadedFile, callback) {
	var filename = uploadedFile.name || 'upload';
	var extension = path.extname(filename) || '';

	filename = Date.now() + '-' + validator.escape(filename.substr(0, filename.length - extension.length)).substr(0, 255) + extension;
	var storedFile;
	async.waterfall([
		function (next) {
			var folder = action + '/aom';
			file.saveFileToLocal(filename, folder, uploadedFile.path, next);
		},
		function (upload, next) {
			storedFile = {
				url: nconf.get('relative_path') + upload.url,
				path: upload.path,
				name: uploadedFile.name,
			};

			if(action == 'replays') {
				aomParser = require('./lib/aomparser');
				aomParser.init(storedFile.path, function(err, res){
					storedFile.push({
						replay: res.replay,
						replay_error: err
					});
				});
			}

			var fileKey = upload.url.replace(nconf.get('upload_url'), '');
			db.sortedSetAdd('uid:' + uid + ':' + action, Date.now(), fileKey, next);
		},
		/*function (next) {
			plugins.fireHook('filter:uploadStored', { uid: uid, uploadedFile: uploadedFile, storedFile: storedFile }, next);
		},*/
		function (next) {
			next(null, storedFile);
		},
	], callback);
}

function deleteTempFiles(files) {
	async.each(files, function (fileObj, next) {
		file.delete(fileObj.path);
		next();
	});
}

UploadSC.uploadCroppedImage = function (data, callback) {
	if (!meta.config.allowProfileImageUploads) {
		return callback(new Error('[[error:profile-image-uploads-disabled]]'));
	}

	if (!data.imageData && !data.file) {
		return callback(new Error('[[error:invalid-data]]'));
	}

	if(data.action != 'extensions' && data.action != 'tournaments' || data.module != 'picture' && data.module != 'cover') {
		return callback(new Error('[[error:invalid-data]]'));
	}

	var size = data.file ? data.file.size : image.sizeFromBase64(data.imageData);
	var uploadSize = data.module != 'picture' ? 5000 : meta.config.maximumProfileImageSize;
	if (size > uploadSize * 1024) {
		return callback(new Error('[[error:file-too-big, ' + uploadSize + ']]'));
	}

	var type = data.file ? data.file.type : image.mimeFromBase64(data.imageData);
	if (!type || !type.match(/^image./)) {
		return callback(new Error('[[error:invalid-image]]'));
	}
	var extension = file.typeToExtension(type);
	if (!extension) {
		return callback(new Error('[[error:invalid-image-extension]]'));
	}

	var uploadedImage;

	var picture = {
		name: 'sc' + data.module,
		uid: data.uid,
		width: data.module != 'picture' ? 428 : meta.config.profileImageDimension,
		height: data.module != 'picture' ? 180 : meta.config.profileImageDimension,
		folder: data.action + '/aom/' + data.module
	};

	async.waterfall([
		function (next) {
			if (data.file) {
				return setImmediate(next, null, data.file.path);
			}
			image.writeImageDataToTempFile(data.imageData, next);
		},
		function (path, next) {
			convertToPNG(path, extension, next);
		},
		function (path, next) {
			picture.path = path;
			image.resizeImage({
				path: picture.path,
				width: picture.width,
				height: picture.height,
			}, next);
		},
		function (next) {
			var filename = generateProfileImageFilename(data.uid, picture.name, extension);
			image.uploadImage(filename, folder, picture, next);
			console.log('subido');
		},
		/*function (data, next) {
			uploadedImage = _uploadedImage;

			User.setUserFields(data.uid, {
				uploadedpicture: uploadedImage.url,
				picture: uploadedImage.url,
			}, next);
		},*/
	], function (err) {
		file.delete(picture.path);
		callback(err, data);
	});
};

function convertToPNG(path, extension, callback) {
	var convertToPNG = meta.config['profile:convertProfileImageToPNG'] === 1;
	if (!convertToPNG) {
		return setImmediate(callback, null, path);
	}
	async.waterfall([
		function (next) {
			image.normalise(path, extension, next);
		},
		function (newPath, next) {
			file.delete(path);
			next(null, newPath);
		},
	], callback);
}

function generateProfileImageFilename(uid, type, extension) {
	var keepAllVersions = meta.config['profile:keepAllUserImages'] === 1;
	var convertToPNG = meta.config['profile:convertProfileImageToPNG'] === 1;
	return uid + '-' + type + (keepAllVersions ? '-' + Date.now() : '') + (convertToPNG ? '.png' : extension);
}
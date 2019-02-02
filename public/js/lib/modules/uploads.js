'use strict';
/* global ajaxify, config */

define('uploads', ['imageCropper'], function (imageCropper) {
	var Uploads = {},
		cfr_token;

	Uploads.init = function(data) {
		//header.init();
		handleImageUpload(data);
		handleFileUpload(data);

		data.scModal.find('.scRcSubmit').on('click', function () {
			createRs(data);
		});
	};

	function createRs(data) {
		var scModal = data.scModal;
		var modalData = {
			rc: data.rc,
			title: scModal.find('#scTitle').val(),
			body: scModal.find('#scBody').val(),
			jumble: scModal.attr('jumble')
		};

		if(data.rc == 'extension') {
			modalData.online = scModal.find('#scWorksOnline').val();
			modalData.type = scModal.find('#scExtensionType').val();
		}

		if(data.rc == 'tournament') {
			modalData.start = scModal.find('#scStart').val();
			modalData.size = scModal.find('#scSize').val();
		}

		console.log(modalData);

		socket.emit('plugins.extendedsc.createRc', modalData, function (err, data) {
			if (err) {
				return app.alertError(err.message);
			}
			console.log(data);
			scModal.removeAttr('jumble');
			scModal.modal('hide');
			scModal.find("input, textarea, select").val('');
			
			/*app.alertSuccess('[[user:profile_update_success]]');

			if (data.picture) {
				$('#user-current-picture').attr('src', data.picture);
			}

			updateHeader(data.picture);*/
		});
	}

	function handleFileUpload(data) {
		data.scModal.find('.fileInput').on('click', function () {
			var _this = $(this);
			$('#files').on('change', function(e) {
				var files = (e.target || {}).files || ($(this).val() ? [{name: $(this).val(), type: utils.fileMimeType($(this).val())}] : null);
				if (files) {
					data.push({files: files, uid: config.uid, rc:data.rc, module: _this.attr('module')});
					formUpload(form);
				}
			});
			$('#files').click();
		});
	}

	function formUpload(params) {
        var files = params.files;
        var uploadForm = $('#filesForm');
        var doneUploading = false;
		uploadForm.attr('action', config.relative_path + '/extendedsc/file/upload');
		
		for (var i = 0; i < files.length; ++i) {
            if (!app.user.privileges['upload:post:file']) {
                return app.alertError('[[error:no-privileges]]');
			}

			if (files[i].size > parseInt(config.maximumFileSize, 10) * 1024) {
				uploadForm[0].reset();
				return app.alertError('[[error:file-too-big, ' + config.maximumFileSize + ']]');
			}
		}

		uploadForm.off('submit').submit(function() {
            $(this).ajaxSubmit({
                headers: {
                    'x-csrf-token': config.csrf_token
                },
                resetForm: true,
                clearForm: true,
                data: params,

				error: function (xhr) {
                     onUploadError(xhr);
                },

                uploadProgress: function(event, position, total, percent) {
                    console.log('subiendo' + percent + '%');
                },

                success: function(uploads) {
                    doneUploading = true;
                },

                complete: function() {
                    uploadForm[0].reset();
                }
            });

            return false;
        });

        uploadForm.submit();
    }
    
    function onUploadError(xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.error) || '[[error:parse-error]]';
        if (xhr && xhr.status === 413) {
            msg = xhr.statusText || 'Request Entity Too Large';
        }
        app.alertError(msg);
        console.log('onUploadError');
    }

	function handleImageUpload(data) {
		function onUploadComplete(urlOnServer) {
			console.log('onUploadComplete');
			/*urlOnServer = (!urlOnServer.startsWith('http') ? config.relative_path : '') + urlOnServer + '?' + Date.now();

			updateHeader(urlOnServer);

			if (ajaxify.data.picture.length) {
				$('#user-current-picture, img.avatar').attr('src', urlOnServer);
				ajaxify.data.uploadedpicture = urlOnServer;
			} else {
				ajaxify.refresh(function () {
					$('#user-current-picture, img.avatar').attr('src', urlOnServer);
				});
			}*/
		}

		function onRemoveComplete() {
			console.log('onRemoveComplete');
			/*if (ajaxify.data.uploadedpicture === ajaxify.data.picture) {
				ajaxify.refresh();
				updateHeader();
			}*/
		}

		data.scModal.find('.imageInput').on('click', function () {
			imageCropper.init({
				scModal: data.scModal,
				jumble: data.scModal.attr('jumble'),
                rc: data.rc,
                module: $(this).attr('module'),
				socketMethod: 'plugins.extendedsc.uploadRcModule',
				aspectRatio: 1 / 1,
				paramName: 'uid',
				paramValue: config.uid,
				fileSize: config.maximumFileSize,
				allowSkippingCrop: false,
				title: '[[user:upload_picture]]',
				description: '[[user:upload_a_picture]]',
				accept: '.png,.jpg,.bmp',
			}, function (url) {
				onUploadComplete(url);
			});
			return false;
		});

		/*data.scModal.find('[data-action="remove-uploaded"]').on('click', function () {
			socket.emit('user.removeUploadedPicture', {
				uid: ajaxify.data.theirid,
			}, function (err) {
				modal.modal('hide');
				if (err) {
					return app.alertError(err.message);
				}
				onRemoveComplete();
			});
		});*/
    }
    
    /*function changeUserPicture(type, callback) {
		socket.emit('user.changePicture', {
			type: type,
			uid: ajaxify.data.theirid,
		}, callback);
	}*/

	return Uploads;
});
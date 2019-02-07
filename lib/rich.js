"use strict";

var async = require('async'),
    Hashids = require('hashids'),
    hashids = new Hashids('', 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'),

	UploadSC = require('./uploadsc'),
    Privileges = require('./privileges'),
	meta = require.main.require('./src/meta'),
	db = require.main.require('./src/database'),
	utils = require.main.require('./src/utils');
    
var Rich = {};

Rich.upload = function(socket, data, file, callback){
    async.waterfall([
        function (next) {
            if(!file){
                UploadSC.uploadCroppedImage(data, next);
            }else{
				next(null, file);
			}
        },
        function (result, next) {
            Rich.update(socket, data, result, next);
        }
    ], callback);
};

Rich.update = function(socket, data, imageData, callback){
	var dbData, _key;
    async.waterfall([
        function (next) {
			Rich.get(socket, data, next);
        },
        function (edit, next) {
            if(!edit.flag) {
				if(edit.message == '[[error:no-hash]]' && socket != 'editComponent') {
					//Si no hay un hash, creamos una accion nueva
					var nextid;
					dbData = {
						uid: socket.uid,
						active: false,
						timestamp: Date.now(),
						downloads: 0
					};

					async.waterfall([
						function (next) {
							getNewData(data, imageData, next);
						},
						function (newData, next) {
							nextid = newData.id;
							dbData = Object.assign(dbData, newData.db);
							db.incrObjectField('global', nextid, next);
						},
						function (id, next) {
							nextid = (nextid.toLowerCase()).replace('next','');
							dbData[nextid] = id;
							dbData.hash = hashids.encode(socket.uid, id, dbData.timestamp);
							console.log(dbData);
							db.setObject(data.rc + ':' + id, dbData, next);
						},
						function (next) {
							dbData.key = data.rc + ':' + dbData[nextid];
							next(null, dbData);
						}
					], callback);
				}else{
					return next(new Error(edit.message));
				}
			}else{
				_key = edit.key;
				getNewData(data, imageData, next);
			}
        },
        function (newData, next) {
			if(newData){
				dbData = newData.db;
            	dbData['lastedit'] = Date.now();
            	db.setObject(_key, dbData, next);
			}else{
				next();
			}
        },
        function (next) {
			dbData.key = _key;
            next(null, dbData);
        }
    ], callback);
};

Rich.get = function(socket, data, callback){
	if(data.jumble && typeof data.jumble === 'string') {
		var hashed = hashids.decode(data.jumble),
			key = data.rc + ':' + hashed[1],
			dbData = {};
		async.waterfall([
			function (next) {
				db.getObject(key, next);
			},
			function (oldData, next) {
				if(!oldData){
					next(null, {flag: false, message: '[[error:no-privileges]]'});
				}else{
					dbData.db = oldData;
					Privileges.canEditModule(key, socket.uid, next);
				}
			},
			function (right, next) {
				next(null, Object.assign(right, dbData));
			}
		], function(err, result){
			result.key = key;
			callback(null, result);
		});
	}else{
		callback(null, {flag:false, message:'[[error:no-hash]]'});
	}
};
                
function getNewData(data, imageData, callback) {
	let dbData = {};
	let _safe = dbData.db = {name: data.rc};
	let ids = {
		extension: 'nextEXid',
		tournament: 'nextTOid',
		replay: 'nextREid',
	};

	dbData.id = ids[data.rc];

	if(!imageData) {
		switch(data.rc) {
			case 'extension':
				async.waterfall([
					function (next) {
						data.title = String(data.title).trim();
						validLength(data.title, meta.config.minimumTitleLength, meta.config.maximumTitleLength, 'title-too-short', 'title-too-long', next);
					},
					function (title, next) {
						_safe.title = title;
						data.content = utils.rtrim(data.content);
						validLength(data.content, meta.config.minimumPostLength, meta.config.maximumPostLength, 'content-too-short', 'content-too-long', next);
					},
					function (content, next) {
						_safe.content = content;
						next(null, typeof data.online === 'boolean'? data.online : false);
					},
					function (online, next) {
						_safe.online = online;
						validSelection(data.type, ['interface', 'texture', 'campaign', 'model', 'map', 'editor'], 'invalid-extensiontype', next);
					},
					function (type, next) {
						_safe.type = type;
						_safe.active = true;
						next(null, dbData);
					},
				], callback);
				break;
			case 'tournament':
				async.waterfall([
					function (next) {
						data.title = String(data.title).trim();
						validLength(data.title, meta.config.minimumTitleLength, meta.config.maximumTitleLength, 'title-too-short', 'title-too-long', next);
					},
					function (title, next) {
						_safe.title = title;
						data.content = utils.rtrim(data.content);
						validLength(data.content, meta.config.minimumPostLength, meta.config.maximumPostLength, 'content-too-short', 'content-too-long', next);
					},
					function (content, next) {
						///hay que ver la fecha
						_safe.content = content;
						next(null, typeof data.startTime === 'boolean'? data.startTime : false);
					},
					function (startTime, next) {
						_safe.startTime = startTime;
						validSelection(data.matchFormat, ['duel', 'friends', 'clans'], 'invalid-matchtype', next);
					},
					function (matchFormat, next) {
						_safe.matchFormat = matchFormat;
						if(matchFormat != 'duel') {
							validNumber(data.teamSize, 0, 6, 'invalid-teamsize', next);
						}else{
							next(null, 1);
						}
					},
					function (teamSize, next) {
						_safe.teamSize = teamSize;
						validSelection(data.gameMode, ['supremacy','conquest','ligthning','deathmatch','free for all'], 'invalid-gamemode', next);
					},
					function (gameMode, next) {
						_safe.gameMode = gameMode;
						validSelection(data.stageMode, ['single', 'groups'], 'invalid-stagemode', next);
					},
					function (stageMode, next) {
						_safe.stageMode = stageMode;
						if(stageMode != 'single') {
							validSelection(data.groupsFormat, ['single elimination', 'double elimination', 'round robin'], 'invalid-groupsformat', next);
						}else{
							next(null, false);
						}
					},
					function (groupsFormat, next) {
						if(groupsFormat) _safe.groupsFormat = groupsFormat;
						validSelection(data.singleFormat, ['single elimination', 'double elimination', 'round robin'], 'invalid-singleformat', next);
					},
					function (singleFormat, next) {
						_safe.singleFormat = singleFormat;
						if(_safe.stageMode != 'single') {
							validNumber(data.playersPerGroup, 0, 20, 'invalid-playerspergroup', next);
						}else{
							next(null, false);
						}
					},
					function (playersPerGroup, next) {
						if(playersPerGroup) _safe.playersPerGroup = playersPerGroup;
						if(_safe.stageMode != 'single') {
							validNumber(data.winnersPerGroup, 0, 20, 'invalid-winnersPerGroup', next);
						}else{
							next(null, false);
						}
					},
					function (winnersPerGroup, next) {
						if(winnersPerGroup) _safe.winnersPerGroup = winnersPerGroup;
						validNumber(data.playersLimit, 0, 120, false, next);
					},
					function (playersLimit, next) {
						if(playersLimit) _safe.playersLimit = playersLimit;
						validNumber(data.minRating, 0, 3000, false, next);
					},
					function (minRating, next) {
						if(minRating) _safe.minRating = minRating;
						validSelection(data.server, ['any server', 'voobly', 'steam'], 'invalid-server', next);
					},
					function (server, next) {
						_safe.server = server;
						_safe.active = true;
						next(null, dbData);
					}
				], callback);
				break;
			default:
				callback(new Error('[[error:no-privileges]]'));
		}
	}else{
		_safe[data.module] = imageData.url;
		if(imageData.replay) {
			_safe.active = true;
			_safe = Object.assign(_safe, imageData.replay);
		} 
		callback(null, dbData);
	}
}

function validLength(item, min, max, minError, maxError, callback) {
	// Trim and remove HTML (latter for composers that send in HTML, like redactor)
	if (typeof item === 'string') {
		item = utils.stripHTMLTags(item).trim();
	}

	if (item === null || item === undefined || item.length < parseInt(min, 10)) {
		return callback(new Error('[[error:' + minError + ', ' + min + ']]'));
	} else if (item.length > parseInt(max, 10)) {
		return callback(new Error('[[error:' + maxError + ', ' + max + ']]'));
	}
	callback(null, item);
}

function validSelection(item, list, err, callback) {
	if(list.includes(item)) {
		callback(null, item);
	} else {
		return callback(new Error('[[error:' + err + ']]'));
	}
}

function validNumber(item, min, max, err, callback) {
	item = parseInt(item, 10);
	if(item == null || item == undefined || item > max || item < min) {
		if(err){
			return callback(new Error('[[error:' + err + ']]'));
		}
		callback(null, false);
	}
	callback(null, item);
}

module.exports = Rich;






"use strict";

var async = require('async'),
    Hashids = require('hashids'),
    hashids = new Hashids('', 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'),

	UploadSC = require('./uploadsc'),
    Privileges = require('./privileges'),
	meta = require('./src/meta'),
	db = require('./src/database');
    
var Actions = {};

Actions.uploadFile = function(data, file, callback){
    var hashed = hashids.decode(data.hash),
        key = data.action + ':' + hashed[1],
        imageData;
    async.waterfall([
        function (next) {
            if(!file){
                UploadSC.uploadCroppedImage(data, next);
            }
            next(null, file);
        },
        function (result, next) {
            imageData.push(result);
            NodeBB.db.getObject(key, next);
        },
        function (oldData, next) {
            if(!oldData) {
                Actions.create(data, imageData, next);
            }
            Actions.edit(data, imageData, next);
        },
    ], callback);
};

Actions.edit = function(data, imageData, callback){
    var hashed = hashids.decode(data.hash),
        key = data.action + ':' + hashed[1],
        dbData;

    async.waterfall([
        function (next) {
            NodeBB.db.getObject(key, next);
        },
        function (oldData, next) {
            if(!oldData){
               return next('module not exist');
            }
            Privileges.canEditModule(oldData[data.nextid], data.uid, next);
        },
        function (canEdit, next) {
            if(!canEdit.flag)
            {
                return next(new Error(canEdit.message));
            }
            if(!imageData) {
                if(data.nextid != 'Eid') {
                    tournamentDataValid(data, next);
                }else {
                    extensionDataValid(data, next);
                }
            }
            dbData[data.module] = imageData.url;
            next();
        },
        function (newData, next) {
            if(newData){
                dbData.push(newData);
            }
            dbData['lastedit'] = Date.now();
            NodeBB.db.setObject(key, dbData, next);
        },
        function (next) {
            next(null, dbData);
        }
  
    ], callback);
};

Actions.create = function(data, imageData, callback){
    var timestamp = data.timestamp || Date.now(),
        dbData = {
            uid: data.uid,
            active: false,
            timestamp: timestamp,
            downloads: 0
        };

    async.waterfall([
        function (next) {
            if(!imageData) {
                if(data.nextid != 'Eid') {
                    tournamentDataValid(data, next);
                }else {
                    extensionDataValid(data, next);
                }
            }
            dbData[data.module] = imageData.url;
        },
        function (newData, next) {
            if(newData) {
                dbData.push(newData);
                dbData['active'] = true;
            }
            next();
        },
        function (next) {
            NodeBB.db.incrObjectField('global', 'next' + data.nextid, next);
        },
        function (id, next) {
            dbData['next' + data.nextid.toLowerCase()] = id;
            dbData.hash = hashids.encode(data.uid, id, timestamp);
            NodeBB.db.setObject(data.action + ':' + id, dbData, next);
        },
        function (next) {
            next(null, dbData);
        }
    ], callback);
};

function extensionDataValid(mdlData, callback) {
	var dbData = {};
	async.parallel({
		title: function (next) {
			if (mdlData.title) {
				dbData.title = String(mdlData.title).trim();
				next(null);
			} else {
				next(new Error('[[error:invalid-title]]'));
			}
		},
		body: function (next) {
			if (mdlData.body) {
				dbData.body = utils.rtrim(mdlData.body);
			}
			check(mdlData.body, meta.config.minimumPostLength, meta.config.maximumPostLength, 'content-too-short', 'content-too-long', next);
		},
		online: function (next) {
			if (mdlData.online === 'boolean') {
				dbData.online = mdlData.online;
			} else {
				next();
			}
		},
		type: function (next) {
			if(['interface', 'texture', 'campaign', 'model', 'map', 'editor'].includes(mdlData.type)) {
				dbData.type = mdlData.type;
				next(null, dbData);
			}else{
				next(new Error('[[error:invalid-extensiontype]]'));
			}
		},
	}, function (err) {
		callback(err);
	});
}

function tournamentDataValid(mdlData, callback) {
	var dbData = {};
	async.parallel({
		title: function (next) {
			if (mdlData.title) {
				dbData.title = String(data.title).trim();
				next(null);
			} else {
				next(new Error('[[error:invalid-title]]'));
			}
		},
		body: function (next) {
			if (mdlData.body) {
				dbData.body = utils.rtrim(mdlData.body);
			}
			check(mdlData.body, meta.config.minimumPostLength, meta.config.maximumPostLength, 'content-too-short', 'content-too-long', next);
		},
		startTime: function (next) {
			if (mdlData.online === 'boolean') {
				dbData.online = mdlData.online;
			} else {
				next();
			}
		},
		matchFormat: function (next) {
			if(['single', 'friends', 'clans'].includes(mdlData.type)) {
				dbData.matchFormat = mdlData.matchFormat;
			}else{
				next(new Error('[[error:invalid-matchformat]]'));
			}
		},
		teamSize: function (next) {
			if(mdlData.teamSize > 0 && mdlData.teamSize <= 6) {
				dbData.teamSize = mdlData.teamSize;
			}else{
				next(new Error('[[error:invalid-teamsize]]'));
			}
		},
		gameMode: function (next) {
			if(['supremacy','conquest','ligthning','deathmatch','free for all'].includes(mdlData.gameMode)) {
				dbData.gameMode = mdlData.gameMode;
			}else{
				next(new Error('[[error:invalid-gamemode]]'));
			}
		},
		stageMode: function (next) {
			if(['single', 'groups'].includes(mdlData.stageMode)) {
				dbData.stageMode = mdlData.stageMode;
			}else{
				next(new Error('[[error:invalid-stagemode]]'));
			}
		},
		groupsFormat: function (next) {
			if(['single elimination', 'double elimination', 'round robin'].includes(mdlData.groupsFormat)) {
				dbData.groupsFormat = mdlData.groupsFormat;
				next(null, dbData);
			}else{
				next(new Error('[[error:invalid-groupsformat]]'));
			}
		},
		singleFormat: function (next) {
			if(['single elimination', 'double elimination', 'round robin'].includes(mdlData.singleFormat)) {
				dbData.singleFormat = mdlData.singleFormat;
				next(null, dbData);
			}else{
				next(new Error('[[error:invalid-singleformat]]'));
			}
		},
		playersPerGroup: function (next) {
			if(mdlData.playersPerGroup > 0 && mdlData.playersPerGroup <= 20) {
				dbData.playersPerGroup = mdlData.playersPerGroup;
			}else{
				next();
			}
		},
		winnersPerGroup: function (next) {
			if(mdlData.winnersPerGroup > 0 && mdlData.winnersPerGroup <= 20) {
				dbData.winnersPerGroup = mdlData.winnersPerGroup;
				next(null, dbData);
			}else{
				next(new Error('[[error:invalid-extensiontype]]'));
			}
		},
		playersLimit: function (next) {
			if(Number.isInteger(mdlData.playersLimit) && mdlData.playersLimit > 0) {
				dbData.playersLimit = mdlData.playersLimit;
			}else{
				next();
			}
		},
		minRating: function (next) {
			if(Number.isInteger(mdlData.minRating) && mdlData.minRating > 0) {
				dbData.minRating = mdlData.minRating;
			}else{
				next();
			}
		},
		server: function (next) {
			if(['any server', 'voobly', 'steam'].includes(mdlData.server)) {
				dbData.server = mdlData.server;
				next(null, dbData);
			}else{
				next(new Error('[[error:invalid-server]]'));
			}
		}
	}, function (err) {
		callback(err);
	});
}

function check(item, min, max, minError, maxError, callback) {
	// Trim and remove HTML (latter for composers that send in HTML, like redactor)
	if (typeof item === 'string') {
		item = utils.stripHTMLTags(item).trim();
	}

	if (item === null || item === undefined || item.length < parseInt(min, 10)) {
		return callback(new Error('[[error:' + minError + ', ' + min + ']]'));
	} else if (item.length > parseInt(max, 10)) {
		return callback(new Error('[[error:' + maxError + ', ' + max + ']]'));
	}
	callback();
}

module.exports = Actions;






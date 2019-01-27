'use strict';

var async = require('async');
var meta = require.main.require('./src/meta');
var user = require.main.require('./src/user');
var db = require.main.require('./src/database');

module.exports = function (privileges) {
	privileges = {};

    privileges.canEditModule = function (id, uid, callback) {
		async.waterfall([
			function (next) {
				async.parallel({
					isEditable: async.apply(isModuleEditable, id, uid),
					isAdminOrMod: async.apply(isAdminOrMod, id, uid),
				}, next);
			},
			function (result, next) {
				if (result.isAdminOrMod) {
					return next(null, true);
				}
				next(null, result.isEditable);
			},
		], callback);
    };

    privileges.isOwner = function (id, uid, callback) {
        uid = parseInt(uid, 10);
		if (uid <= 0) {
            return callback('[[error:no-privileges]]');
        }
        db.getObjectField(id, 'uid', function (err, author) {
            callback(err, author === uid);
        });
    };
    
    function isModuleEditable(id, uid, callback) {
		async.waterfall([
			function (next) {
                db.getObjectField(id, 'timestamp', callback);
			},
			function (timestamp, next) {
				var postEditDuration = meta.config.postEditDuration;
				if (postEditDuration && (Date.now() - timestamp > postEditDuration * 1000)) {
					return callback(null, { flag: false, message: '[[error:post-edit-duration-expired, ' + meta.config.postEditDuration + ']]' });
                }
                next();
            },
            async.apply(privileges.isOwner, id, uid),
			function (isOwner, next) {
                next(null, { flag: isOwner, message: '[[error:no-privileges]]' });
			},
		], callback);
	}

	function isAdminOrMod(id, uid, callback) {
        user.isAdministrator(uid, callback);
	}
};
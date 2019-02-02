'use strict';

var async = require('async');
var meta = require.main.require('./src/meta');
var user = require.main.require('./src/user');
var db = require.main.require('./src/database');

var Privileges = {};

Privileges.canEditModule = function (id, uid, callback) {
	async.waterfall([
		function (next) {
			async.parallel({
				isEditable: async.apply(isModuleEditable, id, uid),
				isAdmin: async.apply(user.isAdministrator, uid),
				isMod: async.apply(user.isGlobalModerator, uid)
			}, next);
		},
		function (pr, next) {
			next(null, {
				flag: pr.isAdmin || pr.isMod ? true : pr.isEditable.flag,
				message: pr.isEditable.message,
				isEditable: pr.isEditable.flag,
				isAdmin: pr.isAdmin,
				isMod: pr.isMod,
			});
		},
	], callback);
};

Privileges.isOwner = function (id, uid, callback) {
	uid = parseInt(uid, 10);
	if (uid <= 0) {
		callback(null, false);
	}else{
		db.getObjectField(id, 'uid', function (err, author) {
			callback(err, author === uid);
		});
	}
};

function isModuleEditable(id, uid, callback) {
	async.waterfall([
		function (next) {
			db.getObjectField(id, 'timestamp', next);
		},
		function (timestamp, next) {
			var postEditDuration = meta.config.postEditDuration;
			if (postEditDuration && (Date.now() - timestamp > postEditDuration * 1000)) {
				return callback(null, { flag: false, message: '[[error:post-edit-duration-expired, ' + meta.config.postEditDuration + ']]' });
			}
			next();
		},
		async.apply(Privileges.isOwner, id, uid),
		function (isOwner, next) {
			next(null, {flag: isOwner, message: !isOwner ? '[[error:no-privileges]]' : false});
		},
	], callback);
}

module.exports = Privileges;
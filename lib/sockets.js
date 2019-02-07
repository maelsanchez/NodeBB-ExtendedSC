"use strict";

var Config = require('./config'),
	Shouts = require('./shouts'),
	Rich = require('./rich'),
	NodeBB = require('./nodebb'),

	S = require('string'),

	Sockets = {};

Sockets.events = {
	get: getShouts,
	send: sendShout,
	edit: editShout,
	getPlain: getPlainShout,
	remove: removeShout,
	removeAll: removeAllShouts,
	startTyping: startTyping,
	stopTyping: stopTyping,
	getSettings: Config.user.sockets.getSettings,
	saveSetting: Config.user.sockets.saveSettings,
	getFormattingOptions: getFormattingOptions,

	uploadRcModule: uploadRcModule,
	editRc: editRc,
	createRc: createRc,
	showComponent: showComponent
};

Sockets.uidIndex = {};


function uploadRcModule(socket, data, callback) {
	Rich.upload(socket, data, null, callback);
}

function editRc(socket, data, callback) {
	Rich.update(socket, data, null, callback);
}

function createRc(socket, data, callback) {
	Rich.update(socket, data, null, function(err, result){
		if(err) return callback(err);
		sendShout(socket, {message: '', rich_key: result.key}, callback);
	});
}

function showComponent(socket, data, callback) {
	Rich.get(socket, data, function(err, richData){
		if(!richData.db) {
			return callback(new Error([['error:data-noexist']]));
		}
		richData.template = 'partials/modals/' + richData.db.name + '_show';
		delete richData.key;
		callback(null, richData);
	});
}


function getFormattingOptions(socket, data, callback) {
	module.parent.exports.getFormattingOptions(callback);
}

function getShouts(socket, data, callback) {
	var shoutLimit = parseInt(Config.global.get('limits.shoutLimit'), 10),
		guestsAllowed = Boolean(Config.global.get('toggles.guestsAllowed')),
		start = (-shoutLimit),
		end = -1;

	if (data && data.start) {
		var parsedStart = parseInt(data.start, 10);

		if (!isNaN(parsedStart)) {
			start = parsedStart;
			end = start + shoutLimit;
		}
	}

	if (!socket.uid && !guestsAllowed) {
		return callback(null, []);
	}

	Shouts.getShouts(start, end, callback);
	updateUidIndex(socket);
}

function sendShout(socket, data, callback) {
	console.log('Sockets.uidIndex');
	console.log(Sockets.uidIndex);
	if (!socket.uid || !data || ((!data.message || !data.message.length) & !data.rich_key)) {
		return callback(new Error('invalid-data'));
	}
	data.message = S(data.message).stripTags().trim().s;
	if (data.message.length || data.rich_key) {
		Shouts.addShout(socket.uid, data, function(err, shout) {
			if (err) return callback(err);

			emitEvent('event:extendedsc.receive', shout);
			callback(null, true);
		});
		updateUidIndex(socket);
	}
}

function editShout(socket, data, callback) {
	if (!socket.uid || !data || !data.sid
		|| isNaN(parseInt(data.sid, 10))
		|| !data.edited || !data.edited.length) {

		return callback(new Error('invalid-data'));
	}

	var msg = S(data.edited).stripTags().s;
	if (msg.length) {
		Shouts.editShout(data.sid, msg, socket.uid, function(err, result) {
			if (err) return callback(err);

			emitEvent('event:extendedsc.edit', result);
			callback(err, true);
		});
		updateUidIndex(socket);
	}
}

function getPlainShout(socket, data, callback) {
	if (!socket.uid || !data || !data.sid || isNaN(parseInt(data.sid, 10))) {
		return callback(new Error('invalid-data'));
	}

	Shouts.getPlainShouts([data.sid], callback);
}

function removeShout(socket, data, callback) {
	if (!socket.uid || !data || !data.sid || isNaN(parseInt(data.sid, 10))) {
		return callback(new Error('invalid-data'));
	}

	Shouts.removeShout(data.sid, socket.uid, function(err, result) {
		if (result === true) {
			emitEvent('event:extendedsc.delete', {sid: data.sid});
		}

		callback(err, result);
	});
}

function removeAllShouts(socket, data, callback) {
	if (!socket.uid || !data || !data.which || !data.which.length) {
		return callback(new Error('invalid-data'));
	}

	switch (data.which) {
		case 'all':
			Shouts.removeAll(socket.uid, callback);
			break;
		case 'deleted':
			Shouts.pruneDeleted(socket.uid, callback);
			break;
		default:
			callback(new Error('invalid-data'));
	}
}

function startTyping(socket, data, callback) {
	if (!socket.uid) return callback(new Error('invalid-data'));

	notifyStartTyping(socket.uid);

	if (socket.listeners('disconnect').length === 0) {
		socket.on('disconnect', function() {
			notifyStopTyping(socket.uid);
		});
	}

	callback();
}

function stopTyping(socket, data, callback) {
	if (!socket.uid) return callback(new Error('invalid-data'));

	notifyStopTyping(socket.uid);

	callback();
}

function notifyStartTyping(uid) {
	emitEvent('event:extendedsc.startTyping', { uid: uid });
}

function notifyStopTyping(uid) {
	emitEvent('event:extendedsc.stopTyping', { uid: uid });
}

function emitEvent(event, data) {
	NodeBB.SocketIndex.server.sockets.emit(event, data);
}

function updateUidIndex(socket) {
	if (socket.uid && !socket.isBot) {
		Sockets.uidIndex[socket.uid] = socket;
		if (socket.listeners('disconnect').length === 0) {
			socket.on('disconnect', function() {
				delete Sockets.uidIndex[socket.uid];
			});
		}
	}
}

module.exports = Sockets;
"use strict";
/*global socket*/

(function(Extendedsc) {

	var Messages = {
		getShouts: 'plugins.extendedsc.get',
		sendShout: 'plugins.extendedsc.send',
		removeShout : 'plugins.extendedsc.remove',
		editShout: 'plugins.extendedsc.edit',
		notifyStartTyping: 'plugins.extendedsc.startTyping',
		notifyStopTyping: 'plugins.extendedsc.stopTyping',
		getOriginalShout: 'plugins.extendedsc.getPlain',
		saveSettings: 'plugins.extendedsc.saveSetting',
		getSettings: 'plugins.extendedsc.getSettings',
		getUsers: 'user.loadMore',
		getUserStatus: 'user.checkStatus'
	};

	var Events = {
		onUserStatusChange: 'event:user_status_change',
		onReceive: 'event:extendedsc.receive',
		onDelete: 'event:extendedsc.delete',
		onEdit: 'event:extendedsc.edit',
		onStartTyping: 'event:extendedsc.startTyping',
		onStopTyping: 'event:extendedsc.stopTyping'
	};

	var Handlers = {
		defaultSocketHandler: function(message) {
			var self = this;
			this.message = message;

			return function (data, callback) {
				if (typeof data === 'function') {
					callback = data;
					data = null;
				}

				socket.emit(self.message, data, callback);
			};
		}
	};

	var Sockets = function(sbInstance) {
		this.sb = sbInstance;

		this.messages = Messages;
		this.events = Events;
		// TODO: move this into its own file?
		this.handlers = {
			onReceive: function(data) {
				sbInstance.addShouts(data);

				if (parseInt(data[0].fromuid, 10) !== app.user.uid) {
					sbInstance.utils.notify(data[0]);
				}
			},
			onDelete: function(data) {
				var shout = $('[data-sid="' + data.sid + '"]'),
					uid = shout.data('uid'),

					prevUser = shout.prev('[data-uid].extendedsc-user'),
					prevUserUid = parseInt(prevUser.data('uid'), 10),

					nextShout = shout.next('[data-uid].extendedsc-shout'),
					nextShoutUid = parseInt(nextShout.data('uid'), 10),

					prevUserIsSelf = prevUser.length > 0 && prevUserUid === parseInt(uid, 10),
					nextShoutIsSelf = nextShout.length > 0 && nextShoutUid === parseInt(uid, 10);

				if (shout.length > 0) {
					shout.remove();
				}

				if (prevUserIsSelf && !nextShoutIsSelf) {
					prevUser.prev('.extendedsc-avatar').remove();
					prevUser.remove();

					var lastShout = sbInstance.dom.shoutsContainer.find('[data-sid]:last');
					if (lastShout.length > 0) {
						sbInstance.vars.lastUid = parseInt(lastShout.data('uid'), 10);
						sbInstance.vars.lastSid = parseInt(lastShout.data('sid'), 10);
					} else {
						sbInstance.vars.lastUid = -1;
						sbInstance.vars.lastSid = -1;
					}
				}

				if (parseInt(data.sid, 10) === parseInt(sbInstance.vars.editing, 10)) {
					sbInstance.actions.edit.finish();
				}
			},
			onEdit: function(data) {
				$('[data-sid="' + data[0].sid + '"] .extendedsc-shout-text')
					.html(data[0].content).addClass('extendedsc-shout-edited');
			},
			onUserStatusChange: function(data) {
				sbInstance.updateUserStatus(data.uid, data.status);
			},
			onStartTyping: function(data) {
				$('[data-uid="' + data.uid + '"].extendedsc-avatar').addClass('isTyping');
			},
			onStopTyping: function(data) {
				$('[data-uid="' + data.uid + '"].extendedsc-avatar').removeClass('isTyping');
			}
		};

		for (var e in this.events) {
			if (this.events.hasOwnProperty(e)) {
				this.registerEvent(this.events[e], this.handlers[e]);
			}
		}

		for (var m in this.messages) {
			if (this.messages.hasOwnProperty(m)) {
				this.registerMessage(m, this.messages[m]);
			}
		}
	};

	Sockets.prototype.registerMessage = function(handle, message) {
		if (!this.hasOwnProperty(handle)) {
			this[handle] = new Handlers.defaultSocketHandler(message);
		}
	};

	Sockets.prototype.registerEvent = function(event, handler) {
		socket.on(event, handler);
	};

	Extendedsc.sockets = {
		init: function(instance) {
			return new Sockets(instance);
		}
	};

})(window.Extendedsc);
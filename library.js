"use strict";
/* globals require, module */

var	NodeBB = require('./lib/nodebb'),
	Config = require('./lib/config'),
	Sockets = require('./lib/sockets'),
	Commands = require('./lib/commands'),
	Controllers = require('./lib/controllers'),
	Aomparser = require('./lib/aomparser'),
	//MarkdownIt = require('markdown-it'),
	SocketPlugins = require.main.require('./src/socket.io/plugins'),

	path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    mv = require('mv'),
    async = require('async'),
    nconf = require.main.require('nconf'),

	app,

	Extendedsc = {};
	Extendedsc.init = {};
	Extendedsc.widget = {};
	Extendedsc.settings = {};

Extendedsc.init.load = function(params, callback) {
	function renderGlobal(req, res, next) {
		Config.getTemplateData(function(data) {
			res.render(Config.plugin.id, data);
		});
	}

	function renderAdmin(req, res, next) {
		Config.getTemplateData(function(data) {
			res.render('admin/plugins/' + Config.plugin.id, data);
		});
	}

	//SocketPlugins.editor = Sockets.editor;
	var router = params.router,
		hostMiddleware = params.middleware,
		multiparty = require.main.require('connect-multiparty')();

	router.get('/' + Config.plugin.id, hostMiddleware.buildHeader, renderGlobal);
	router.get('/api/' + Config.plugin.id, renderGlobal);

	router.get('/admin/plugins/' + Config.plugin.id, hostMiddleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/' + Config.plugin.id, renderAdmin);
	//AOM agregamos el router para el subidor de replays
	router.post('/replay/upload', multiparty, hostMiddleware.validateFiles, hostMiddleware.applyCSRF, Controllers.upload);
	router.post('/extension/upload', multiparty, hostMiddleware.validateFiles, hostMiddleware.applyCSRF, Controllers.upload);
	router.post('/extension/new', multiparty, hostMiddleware.validateFiles, hostMiddleware.applyCSRF, Controllers.upload);
	//router.post('/api/replay/upload', Controllers.upload);

	NodeBB.SocketPlugins[Config.plugin.id] = Sockets.events;
	NodeBB.SocketAdmin[Config.plugin.id] = Config.adminSockets;

	app = params.app;

	// Create "replays/aom" subfolder into upload_path
	mkdirp(path.join(nconf.get('upload_path'), 'replays/aom'));
	mkdirp(path.join(nconf.get('upload_path'), 'extensions/aom'));

	Config.init(callback);
};

Extendedsc.init.addGlobalNavigation = function(header, callback) {
	if (Config.global.get('toggles.headerLink')) {
		header.navigation.push({
			class: '',
			iconClass: 'fa fa-fw ' + Config.plugin.icon,
			route: '/' + Config.plugin.id,
			text: Config.plugin.name
		});
	}

	callback(null, header);
};

Extendedsc.init.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/' + Config.plugin.id,
		icon: Config.plugin.icon,
		name: Config.plugin.name
	});

	callback(null, header);
};

Extendedsc.init.getSounds = function(sounds, callback) {
	sounds.push(__dirname + '/public/sounds/extendedsc-notification.mp3');
	sounds.push(__dirname + '/public/sounds/extendedsc-wobble.mp3');
	sounds.push(__dirname + '/public/sounds/extendedsc-cena.mp3');
	callback(null, sounds);
};

Extendedsc.widget.define = function(widgets, callback) {
	widgets.push({
		name: Config.plugin.name,
		widget: Config.plugin.id,
		description: Config.plugin.description,
		content: ''
	});

	callback(null, widgets);
};

Extendedsc.widget.render = function(widget, callback) {
	//Remove any container
	widget.data.container = '';

	Config.user.get({ uid: widget.uid, settings: {} }, function(err, result) {
		Config.getTemplateData(function(data) {

			data.hiddenStyle = '';
			if (!err && result && result.settings && parseInt(result.settings['extendedsc:toggles:hide'], 10) == 1) {
				data.hiddenStyle = 'display: none;';
			}

			app.render('extendedsc/panel', data, callback);
		});
	});
};

Extendedsc.settings.addUserSettings = function(settings, callback) {
	app.render('extendedsc/user/settings', { settings: settings.settings }, function(err, html) {
		settings.customSettings.push({
			title: Config.plugin.name,
			content: html
		});

		callback(null, settings);
	});
};

Extendedsc.settings.getUserSettings = function(data, callback) {
	Config.user.get(data, callback);
};

Extendedsc.settings.saveUserSettings = function(data) {
	Config.user.save(data);
};

Extendedsc.getFormattingOptions = function(callback) {
	var formatting = [
		{ name: 'bold', className: 'fa fa-bold', title: '[[modules:composer.formatting.bold]]' },
		{ name: 'italic', className: 'fa fa-italic', title: '[[modules:composer.formatting.italic]]' },
		{ name: 'list', className: 'fa fa-list', title: '[[modules:composer.formatting.list]]' },
		{ name: 'strikethrough', className: 'fa fa-strikethrough', title: '[[modules:composer.formatting.strikethrough]]' },
		{ name: 'code', className: 'fa fa-code', title: '[[modules:composer.formatting.code]]' },
		{ name: 'link', className: 'fa fa-link', title: '[[modules:composer.formatting.link]]' },
		{ name: 'picture-o', className: 'fa fa-picture-o', title: '[[modules:composer.formatting.picture]]' },
	];
	callback(null, formatting);
};

Extendedsc.processUpload = function(payload, callback) {
	var id = path.basename(payload.path),
		uploadPath = path.join(nconf.get('upload_path'), 'replays/aom', id);
	console.log(payload);

	async.waterfall([
		async.apply(mv, payload.path, uploadPath)
	], function(err) {
		if (err) {
			return callback(err);
		}

		Aomparser.init(id, function(err, res){
			callback(null, { id: res.id });
		});
		/*callback(null, {
			id: id
		});*/
	});

	
};

module.exports = Extendedsc;

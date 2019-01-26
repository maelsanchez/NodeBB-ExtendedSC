"use strict";
/* globals require, module */

var	NodeBB = require('./lib/nodebb'),
	Config = require('./lib/config'),
	Sockets = require('./lib/sockets'),
	Commands = require('./lib/commands'),
	UploadSC = require('./lib/uploadsc'),
	//Aomparser = require('./lib/aomparser'),
	//MarkdownIt = require('markdown-it'),
	SocketPlugins = require.main.require('./src/socket.io/plugins'),

	path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    mv = require('mv'),
    async = require('async'),
	nconf = require.main.require('nconf'),
	meta = require.main.require('./src/meta'),

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

	function processUpload(req, res, callback) {
		async.waterfall([
			function (next) {
				UploadSC.init(req, res, next);
			},
			function (fileData, next) {
				if(req.body.action == 'extensions') {
					Actions.uploadFile(req.body, fileData, callback);
				}
				next(null, fileData);
			},
			function (result, next) {
				next(null, result);
				//res.json([result]);
			},
		], callback);
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
	router.post('/extendedsc/file/upload', multiparty, hostMiddleware.validateFiles, hostMiddleware.applyCSRF, processUpload);
	//router.post('/extendedsc/upload', Controllers.upload);
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

Extendedsc.addPrefetchTags = function(hookData, callback) {
	var prefetch = [
		'/assets/src/modules/editor.js',  '/assets/src/modules/editor/resize.js', '/assets/templates/editor.tpl'
		//'/assets/language/' + (meta.config.defaultLang || 'en-GB') + '/topic.json',
		//'/assets/language/' + (meta.config.defaultLang || 'en-GB') + '/modules.json',
		//'/assets/language/' + (meta.config.defaultLang || 'en-GB') + '/tags.json'
	];

	hookData.links = hookData.links.concat(prefetch.map(function(path) {
		return {
			rel: 'prefetch',
			href: nconf.get('relative_path') + path + '?' + meta.config['cache-buster']
		};
	}));

	callback(null, hookData);
};

Extendedsc.getFormattingOptions = function(callback) {
	var formatting = [
		{ name: 'bold', className: 'fa fa-bold', title: '[[modules:editor.formatting.bold]]' },
		{ name: 'italic', className: 'fa fa-italic', title: '[[modules:editor.formatting.italic]]' },
		{ name: 'list', className: 'fa fa-list', title: '[[modules:editor.formatting.list]]' },
		{ name: 'strikethrough', className: 'fa fa-strikethrough', title: '[[modules:editor.formatting.strikethrough]]' },
		{ name: 'code', className: 'fa fa-code', title: '[[modules:editor.formatting.code]]' },
		{ name: 'link', className: 'fa fa-link', title: '[[modules:editor.formatting.link]]' },
	];
	callback(null, formatting);
};


module.exports = Extendedsc;

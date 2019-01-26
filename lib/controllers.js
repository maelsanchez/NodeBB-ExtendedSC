'use strict';

//var Config = require('./config');
var Controllers = {};

/*Controllers.renderGlobal = function(req, res, next) {
    Config.getTemplateData(function(data) {
        res.render(Config.plugin.id, data);
    });
};

Controllers.renderAdmin = function(req, res, next) {
    Config.getTemplateData(function(data) {
        res.render('admin/plugins/' + Config.plugin.id, data);
    });
};*/

Controllers.upload = function(req, res, next) {
	var main = module.parent.exports;
	console.log(req.body.title);
	console.log(req.body.body);
	console.log(req.body.type);
	console.log(req.data);
	console.log(req);

	/*main.processUpload(req.files.files[0], function(err, payload) {
		if (!err) {
			res.json([{
				url: payload.id
			}]);
		} else {
			res.json({
				error: err.message === 'invalid-file-type' ? 'Invalid File Type Uploaded. Please check the file format or extension to ensure it is an audio file.' : 'An unknown error occured'
			});
		}
	});*/
};

module.exports = Controllers;
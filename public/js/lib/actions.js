"use strict";

/*'use strict';
 global ajaxify, config

define('extendedsc/actions', [], function () {
	var allActions = [];
	var Actions = {};


	Actions.init = function(data) {
		var action;
		allActions.forEach(function(actObj) {
			action = new actObj.obj(sbInstance);
			action.register();

			this[actObj.name] = action;
		}, this);
	};
	
	Actions.register = function(name, obj) {
		allActions.push({
			name: name,
			obj: obj
		});
    };
    
    Rc.parse = function(data) {
		console.log('parse');
    };
});*/

(function(Extendedsc) {
	var allActions = [];
	
	var Actions = function(sbInstance) {
		var action;
		allActions.forEach(function(actObj) {
			action = new actObj.obj(sbInstance);
			action.register();

			this[actObj.name] = action;
		}, this);
	};
	
	Extendedsc.actions = {
		init: function(sbInstance) {
			return new Actions(sbInstance);
		},
		register: function(name, obj) {
			allActions.push({
				name: name,
				obj: obj
			});
		}
	};
	
})(window.Extendedsc);
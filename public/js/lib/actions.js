"use strict";

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
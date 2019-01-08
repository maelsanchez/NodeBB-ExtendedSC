"use strict";

(function(Extendedsc) {
	var Hide = function(sbInstance) {
		this.register = function() {
			sbInstance.settings
				.off('toggles.hide')
				.on('toggles.hide', handle);
		};

		function handle(value) {
			var body = sbInstance.dom.container.find('.panel-body');

			if (value === 1) {
				body.slideUp();
			} else {
				body.slideDown();
			}
		}
	};

	Extendedsc.actions.register('hide', Hide);
})(window.Extendedsc);
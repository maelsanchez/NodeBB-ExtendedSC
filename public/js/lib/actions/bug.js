"use strict";

(function(Extendedsc) {
	var Bug = function(sbInstance) {
		this.register = function() {
			sbInstance.dom.container.find('.extendedsc-button-bug').off('click').on('click', function() {
				window.open('https://github.com/maelsanchez/NodeBB-ExtendedSC/issues/new', '_blank').focus();
			});
		};
	};

	Extendedsc.actions.register('bug', Bug);
})(window.Extendedsc);
"use strict";
/* global ajaxify, config */

(function(Extendedsc) {
	var Replay = function(sbInstance) {
		this.register = function() {
            sbInstance.dom.container.find('.extendedsc-button-replay').addClass('fileInput');
            require(['uploads'], function(uploads) {
                uploads.init({
                    action: 'replays',
                });
            });
        };
    };

	Extendedsc.actions.register('replay', Replay);
})(window.Extendedsc);
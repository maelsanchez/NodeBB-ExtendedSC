"use strict";
/* global ajaxify, config */

(function(Extendedsc) {
	var Replay = function(sbInstance) {
		this.register = function() {
            sbInstance.dom.container.find('.extendedsc-button-replay').addClass('fileInput').attr('module', 'file');
            require(['uploads'], function(uploads) {
                uploads.init({
                    rc: 'replay'
                });
            });
        };
    };

	Extendedsc.actions.register('replay', Replay);
})(window.Extendedsc);
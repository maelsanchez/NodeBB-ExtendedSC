"use strict";
/* global ajaxify, config */

(function(Extendedsc) {
	var Extension = function(sbInstance) {
		this.register = function() {
			ajaxify.loadTemplate('extendedsc/features/extension', function(tpl){
				$(document.body).append(tpl);
                var extModal = $('#extendedsc-modal-extension');
                
				sbInstance.dom.container.find('.extendedsc-button-extension').off('click').on('click', function(e) {
                    extModal.modal('show');
                    $(window).trigger('action:editor.extension.new', {});
                    require(['uploads'], function(uploads) {
                        uploads.init({
                            scModal: extModal,
                            rc: 'extension',
                        });
                    });
				});
            });
        };
    };

	Extendedsc.actions.register('extension', Extension);
})(window.Extendedsc);
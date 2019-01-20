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
                    $(window).trigger('action:extendedsc.file.upload', {module: 'extension', name: 'fileExt', file: true});
				});

				extModal.find('#extendedsc-button-create-extension-submit').off('click').on('click', function(e) {
                    sbInstance.upload.uploadFiles({
                        module: 'extension',
                        title: extModal.find('#inputExtname').val(),
                        body: extModal.find('#inputExtname').val(),
                        online: extModal.find('#typeExt').val(),
                        type: extModal.find('#onlineExt').val(),
                    });
				});
            });
        };
    };

	Extendedsc.actions.register('extension', Extension);
})(window.Extendedsc);
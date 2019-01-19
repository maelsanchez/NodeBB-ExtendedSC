'use strict';

/* globals config, ajaxify */

$(document).ready(function() {
    $(window).on('action:editor.extension.new', function(ev, data) {
		require(['editor'], function(editor) {
            editor.newExtension({
                eid: data.eid,
                title: data.title || '',
                body: data.body || '',
            });
        });
	});
});
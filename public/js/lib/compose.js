'use strict';
/* globals define */

define('forum/editor', [], function () {
	var Editor = {};

	Editor.init = function () {
		var container = $('.editor');

		if (container.length) {
			$(window).trigger('action:editor.enhance', {
				container: container,
			});
		}
	};

	return Editor;
});
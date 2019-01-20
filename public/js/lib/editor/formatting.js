'use strict';

/* globals app, define, screenfull */

define('editor/formatting', ['editor/controls'], function(controls, resize) {

	var formatting = {};
	var formattingDispatchTable = {};
	var buttons = [];

	formatting.addEditorButtons = function() {
		for(var x=0,numButtons=buttons.length;x<numButtons;x++) {
			$('.formatting-bar .formatting-group #fileForm').before('<li tabindex="-1" data-format="' + buttons[x].name + '" title="' + (buttons[x].title || '') + '"><i class="' + buttons[x].iconClass + '"></i></li>');
		}
	};

	formatting.addButton = function(iconClass, onClick, title) {
		var name = iconClass.replace('fa fa-', '');

		formattingDispatchTable[name] = onClick;
		buttons.push({
			name: name,
			iconClass: iconClass,
			title: title
		});
	};

	formatting.getDispatchTable = function () {
		return formattingDispatchTable;
	};

	formatting.addButtonDispatch = function(name, onClick) {
		formattingDispatchTable[name] = onClick;
	};

	formatting.addHandler = function(postContainer) {
		postContainer.on('click', '.formatting-bar li', function () {
			var format = $(this).attr('data-format'),
				textarea = $(this).parents('[component="editor"]').find('textarea')[0];

			if(formattingDispatchTable.hasOwnProperty(format)){
				formattingDispatchTable[format].call(postContainer, textarea, textarea.selectionStart, textarea.selectionEnd);
				preview.render(postContainer);
			}
		});
	};

	return formatting;
});
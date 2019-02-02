'use strict';

/* globals define, socket, app, config, ajaxify, utils, bootbox, screenfull */

define('editor', [
	'taskbar',
	'translator',
	'editor/controls',
	//'editor/uploads',
	'editor/formatting',
	//'editor/drafts',
	//'editor/tags',
	//'editor/categoryList',
	//'editor/preview',
	//'editor/resize',
	//'editor/autocomplete',
	'scrollStop'
], function(taskbar, translator, controls, formatting, scrollStop) {
	var editor = {
		active: undefined,
		posts: {},
		bsEnvironment: undefined,
		formatting: undefined,
	};

	editor.addButton = function(iconClass, onClick, title) {
		formatting.addButton(iconClass, onClick, title);
	};

	editor.enhance = function(postContainer, editor_uuid, postData) {
		if (!editor_uuid && !postData) {
			editor_uuid = utils.generateUUID();
			editor.posts[editor_uuid] = postData = ajaxify.data;
			postContainer.attr('data-uuid', editor_uuid);
		}

		var bodyEl = postContainer.find('textarea');
		//var draft = drafts.getDraft(postData.save_id);

		formatting.addHandler(postContainer);
		formatting.addEditorButtons();
		//preview.handleToggler(postContainer);
		//autocomplete.init(postContainer, editor_uuid);

		postContainer.on('change', 'input, textarea', function() {
			editor.posts[editor_uuid].modified = true;
		});

		//iniciamos el markdown
		editor.capturePaste(bodyEl);
		editor.prepareFormattingTools();
	};

	function createNewEditor(editor_uuid) {
		var postData = editor.posts[editor_uuid],
			isEditing = postData ? !!postData.pid : false,
			isGuestPost = postData ? parseInt(postData.uid, 10) === 0 : false;

		// see
		// https://github.com/NodeBB/NodeBB/issues/2994 and
		// https://github.com/NodeBB/NodeBB/issues/1951
		// remove when 1951 is resolved

		//var title = postData.title.replace(/%/g, '&#37;').replace(/,/g, '&#44;');

		var data = {
			//title: title,
			isEditing: isEditing,
			showHandleInput:  config.allowGuestHandles && (app.user.uid === 0 || (isEditing && isGuestPost && app.user.isAdmin)),
			handle: postData ? postData.handle || '' : undefined,
			formatting: editor.formatting,
			privileges: app.user.privileges,
		};

		app.parseAndTranslate('editor', data, function(editorTemplate) {
			/*if ($('.editor.editor[data-uuid="' + editor_uuid + '"]').length) {
				return;
			}*/
			editorTemplate = $(editorTemplate);

			/*editorTemplate.find('.title').each(function () {
				$(this).text(translator.unescape($(this).text()));
			});*/

			editorTemplate.attr('data-uuid', editor_uuid);

			$('.editorBody').append(editorTemplate);

			var postContainer = $(editorTemplate[0]);

			editor.enhance(postContainer, editor_uuid, postData);

			$(window).trigger('action:editor.loaded', {
				editor_uuid: editor_uuid,
				editorData: editor.posts[editor_uuid],
				formatting: editor.formatting,
			});

			scrollStop.apply(postContainer.find('.write'));
		});

	}

	editor.load = function(editor_uuid) {
		//checamos si ya existe un editor cargado, si no creamos uno nuevo
		var postContainer = $('.editor[data-uuid="' + editor_uuid + '"]');
		if (postContainer.length) {
			/*activate(editor_uuid);
			resize.reposition(postContainer);
			focusElements(postContainer);
			onShow();*/
		} else {
			if (editor.formatting) {
				createNewEditor(editor_uuid);
			} else {
				socket.emit('plugins.extendedsc.getFormattingOptions', function(err, options) {
					editor.formatting = options;
					createNewEditor(editor_uuid);
				});
			}
		}
	};
	
	editor.newExtension = function(data) {
		//iniciamos un editor para la extension enviado algunos parametros iniciales
		var pushData = {
			action: 'extension.post',
			eid: data.eid,
			body: data.body || '',
			modified: false,
			isMain: true
		};
		editor.load(pushData);
	};

	editor.capturePaste = function (targetEl) {
		targetEl.on('paste', function (e) {
			console.log('mark:client:onpaste');
			var triggers = [/^>\s*/, /^\s*\*\s+/, /^\s*\d+\.\s+/, /^\s{4,}/];
			var start = e.target.selectionStart;
			var line = getLine(targetEl.val(), start);

			var trigger = triggers.reduce(function (regexp, cur) {
				if (regexp) {
					return regexp;
				}

				return cur.test(line) ? cur : false;
			}, false);

			var prefix = line.match(trigger);
			if (prefix) {
				prefix = prefix[0];

				var payload = e.originalEvent.clipboardData.getData('text');
				var fixed = payload.replace(/^/gm, prefix).slice(prefix.length);

				setTimeout(function () {
					var replacement = targetEl.val().slice(0, start) + fixed + targetEl.val().slice(start + payload.length);
					targetEl.val(replacement);
				}, 0);
			}
		});

		function getLine(text, selectionStart) {
			console.log('mark:client:getLine');
			// Break apart into lines, return the line the cursor is in
			var lines = text.split('\n');

			return lines.reduce(function (memo, cur) {
				if (typeof memo !== 'number') {
					return memo;
				} else if (selectionStart > (memo + cur.length)) {
					return memo + cur.length + 1;
				}

				return cur;
			}, 0);
		}
	};

	editor.prepareFormattingTools = function () {
		console.log('mark:client:prepareFormattingTools');
		if (formatting && controls) {
			translator.getTranslations(window.config.userLang || window.config.defaultLang, 'markdown', function (strings) {
				formatting.addButtonDispatch('bold', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						var block = controls.getBlockData(textarea, '**', selectionStart);

						if (block.in && block.atEnd) {
							// At end of bolded string, move cursor past delimiters
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
						} else {
							controls.insertIntoTextarea(textarea, '**' + strings.bold + '**');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + strings.bold.length + 2);
						}
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '**');
						controls.updateTextareaSelection(textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]);
					}
				});

				formatting.addButtonDispatch('italic', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						var block = controls.getBlockData(textarea, '*', selectionStart);

						if (block.in && block.atEnd) {
							// At end of italicised string, move cursor past delimiters
							controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + 1);
						} else {
							controls.insertIntoTextarea(textarea, '*' + strings.italic + '*');
							controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + strings.italic.length + 1);
						}
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '*');
						controls.updateTextareaSelection(textarea, selectionStart + 1 + wrapDelta[0], selectionEnd + 1 - wrapDelta[1]);
					}
				});

				formatting.addButtonDispatch('list', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, '\n* ' + strings.list_item);

						// Highlight "list item"
						controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + strings.list_item.length + 3);
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
						controls.updateTextareaSelection(textarea, selectionStart + 3 + wrapDelta[0], selectionEnd + 3 - wrapDelta[1]);
					}
				});

				formatting.addButtonDispatch('strikethrough', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						var block = controls.getBlockData(textarea, '~~', selectionStart);

						if (block.in && block.atEnd) {
							// At end of bolded string, move cursor past delimiters
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
						} else {
							controls.insertIntoTextarea(textarea, '~~' + strings.strikethrough_text + '~~');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + strings.strikethrough_text.length + 2);
						}
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '~~', '~~');
						controls.updateTextareaSelection(textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]);
					}
				});

				formatting.addButtonDispatch('code', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, '```\n' + strings.code_text + '\n```');
						controls.updateTextareaSelection(textarea, selectionStart + 4, selectionEnd + strings.code_text.length + 4);
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '```\n', '\n```');
						controls.updateTextareaSelection(textarea, selectionStart + 4 + wrapDelta[0], selectionEnd + 4 - wrapDelta[1]);
					}
				});

				formatting.addButtonDispatch('link', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, '[' + strings.link_text + '](' + strings.link_url + ')');
						controls.updateTextareaSelection(textarea, selectionStart + strings.link_text.length + 3, selectionEnd + strings.link_text.length + strings.link_url.length + 3);
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '[', '](' + strings.link_url + ')');
						controls.updateTextareaSelection(textarea, selectionEnd + 3 - wrapDelta[1], selectionEnd + strings.link_url.length + 3 - wrapDelta[1]);
					}
				});
			});
		}
	};

	return editor;
});
"use strict";
/* global config, app, ajaxify*/

(function(Extendedsc) {
	var Rich = function(instance) {
		this.sb = instance;
		var self = this;
		var buttons = [
			{
				name: 'Extension',
				id: 'extension',
				description: 'Upload AOM Modifications',
				icon: 'fa-bug',
				button: 'Upload MOD',
				enabled: true,
				handlers: {
					onClick:  function(){
						self.showForm('extension', {}, ['description']);
					}
				}
			},
			{
				name: 'Tournament',
				id: 'tournament',
				description: 'Upload AOM Modifications',
				icon: 'fa-bug',
				button: 'Tournament',
				enabled: true,
				handlers: {
					onClick: function() {
						self.showForm('tournament', {}, ['description']);
					}
				}
			},
			{
				name: 'Replay',
				id: 'replay',
				description: 'Upload Age of Mythology Recorded games',
				icon: 'fa-bug',
				button: 'Upload replay',
				enabled: true,
				handlers: {
					onInit: function() {
						$('#rcButtonReplay').addClass('fileInput').attr('module', 'file');
						handleFileUpload({container: $('.extendedsc-message-buttons'), id: 'replay'});
					}
				}
			},
		];
		this.build(buttons);
		handleComponents();
		
		function handleComponents() {
			self.sb.dom.container.on('click', '.richcontent', function () {
				socket.emit('plugins.extendedsc.showComponent', {
					rc: $(this).attr('component'),
					jumble: $(this).attr('jumble')
				}, function (err, rc) {
					if (err) {
						return app.alertError(err.message);
					}

					self.showModal(rc.template, rc, function(tpl){
						var modal = bootbox.dialog({
							className: 'rcShowmodal',
							message: tpl,
							show: true,
						});
						console.log(rc);

						modal.on('click', '#editRsData', function(){
							rc.jumble = modal.attr('jumble');
							modal.modal('hide');
							if(rc.flag) self.showForm(rc.db.name, rc.db);
						});

						modal.on('click', '#deleteRsData', function(){
							
						});
					});
				});
				return false;
			});
		}
	};

	Rich.prototype.build = function(actions){
		var self = this;
		actions.forEach(function(el) {
			var btn = $('<button/>', {
				id: 'rcButton'+ el.name,
				class: 'btn btn-primary btn-xs',
				text: el.button,
				title: el.description,
			});
			self.sb.dom.container.find('.extendedsc-message-buttons').append(btn);
			onInit(el.handlers.onInit);
			onClick(btn, el.handlers.onClick);
		});
	};

	Rich.prototype.showForm = function (name, data, writer) {
		var self = this;
		this.showModal('partials/modals/' + name + '_upload', data, function(tpl){
			var modal = bootbox.dialog({
				className: 'rcForm' + name,
				message: tpl,
				show: true,
				buttons: {
					close: {
						label: '[[global:close]]',
						callback: closeModal,
						className: 'btn-link',
					},
					update: {
						label: '[[global:save_changes]]',
						callback: createRcData,
					},
				}
			});

			if(writer){
				require(['editor'], function(editor) {
					writer.forEach(function(id) {
						editor.newExtension({
							eid: id
						});
					});
				});
			}

			var set_up = {container: modal, id: name};
			if(data) handleEntries(modal, data);
			handleImageUpload(set_up);
			handleFileUpload(set_up);

			function createRcData() {
				var values = {};
				$('.rcFormEl').each(function() {
					console.log(this);
					values[this.name] = $(this).prop('type') == 'checkbox'? $(this).prop('checked') : $(this).val();
				});
				values.jumble = modal.attr('jumble');
				values.rc = name;
				console.log(values);
				self.create(modal, values);
			}

			function closeModal() {
				modal.modal('hide');
			}
		});
	};

	Rich.prototype.showModal = function (template, data, callback) {
		require(['translator', 'benchpress'], function(translator, Benchpress) {
			Benchpress.parse(template, data, function (tpl) {
				translator.translate(tpl, callback);
			});
		});
	};

	Rich.prototype.create = function (modal, data) {
		socket.emit('plugins.extendedsc.createRc', data, function (err, res) {
			if (err) {
				return app.alertError(err.message);
			}
			console.log(res);
			modal.modal('hide');
		});
	};

	Rich.prototype.edit = function (data) {
		socket.emit('plugins.extendedsc.editRc', data, function (err, res) {
			if (err) {
				return app.alertError(err.message);
			}
			console.log(res);
			modal.modal('hide');
		});
	};

	function onClick(btn, callback) {
		if(callback) btn.off('click').on('click', callback);
		return true;
	}

	function onInit(callback) {
		if(callback) $(document).ready(callback);
		return true;
	}

	function handleFileUpload(modal) {
		modal.container.find('.fileInput').on('click', function () {
			var _this = $(this),
				form = modal.container.find('#files');
			form.on('change', function(e) {
				var files = (e.target || {}).files || ($(this).val() ? [{name: $(this).val(), type: utils.fileMimeType($(this).val())}] : null);
				if (files) {
					formUpload(modal.container, files, {uid: config.uid, rc: modal.id, module: _this.attr('module')});
				}
			});
			form.click();
		});
	}

	function formUpload(container, files, params) {
        var uploadForm = container.find('#filesForm');
        var doneUploading = false;
		uploadForm.attr('action', config.relative_path + '/extendedsc/file/upload');
		
		for (var i = 0; i < files.length; ++i) {
            if (!app.user.privileges['upload:post:file']) {
                return app.alertError('[[error:no-privileges]]');
			}

			if (files[i].size > parseInt(config.maximumFileSize, 10) * 1024) {
				uploadForm[0].reset();
				return app.alertError('[[error:file-too-big, ' + config.maximumFileSize + ']]');
			}
		}

		uploadForm.off('submit').submit(function() {
            $(this).ajaxSubmit({
                headers: {
                    'x-csrf-token': config.csrf_token
                },
                resetForm: true,
                clearForm: true,
                data: params,

				error: function (xhr) {
                     onUploadError(xhr);
                },

                uploadProgress: function(event, position, total, percent) {
                    console.log('subiendo' + percent + '%');
                },

                success: function(uploads) {
                    doneUploading = true;
                },

                complete: function() {
                    uploadForm[0].reset();
                }
            });

            return false;
        });

        uploadForm.submit();
    }
    
    function onUploadError(xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.error) || '[[error:parse-error]]';
        if (xhr && xhr.status === 413) {
            msg = xhr.statusText || 'Request Entity Too Large';
        }
        app.alertError(msg);
        console.log('onUploadError');
    }

	function handleImageUpload(modal) {
		function onUploadComplete(urlOnServer) {
			console.log('onUploadComplete');
		}

		function onRemoveComplete() {
			console.log('onRemoveComplete');
		}

		modal.container.on('click', '.imageInput', function () {
			require(['imageCropper'], function(imageCropper) {
				imageCropper.init({
					scModal: modal.container,
					jumble: modal.container.attr('jumble'),
					rc: data.id,
					module: $(this).attr('module'),
					socketMethod: 'plugins.extendedsc.uploadRcModule',
					aspectRatio: 1 / 1,
					paramName: 'uid',
					paramValue: config.uid,
					fileSize: config.maximumFileSize,
					allowSkippingCrop: false,
					title: '[[user:upload_picture]]',
					description: '[[user:upload_a_picture]]',
					accept: '.png,.jpg,.bmp',
				}, function (url) {
					onUploadComplete(url);
				});
			});

			return false;
		});
	}

	function handleEntries(modal, data) {
		Object.keys(data).forEach(function (name) {
			var _this = modal.find('[name="'+ name +'"]');
			if(_this.is('select')){
				_this.val(data[name]);
			}
			if(_this.prop('type') == 'checkbox'){
				_this.prop('checked', data[name]);
			}
		});
	}
	
	Extendedsc.rich = {
		init: function(instance) {
			return new Rich(instance);
		}
	}

})(window.Extendedsc);
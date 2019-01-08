"use strict";
/* global ajaxify, config */

(function(Extendedsc) {
    console.log('creado');
	var Replay = function(sbInstance) {
        console.log('config.relative_path:');
        console.log(config);
		this.register = function() {
            sbInstance.dom.container.find('.extendedsc-button-replay').on('click', function(e) {
                $('#rfiles').click();
                console.log('click sobre boton');
            });
			/*ajaxify.loadTemplate('shoutbox/features/replay', function(tpl){
				$(document.body).append(tpl);

				var gistModal = $('#shoutbox-modal-gist');

				sbInstance.dom.container.find('.shoutbox-button-gist').off('click').on('click', function(e) {
					gistModal.modal('show');
				});

				gistModal.find('#shoutbox-button-create-gist-submit').off('click').on('click', function(e) {
					createGist(gistModal.find('textarea').val(), gistModal);
				});
            });*/
            
            $('#rfiles').on('change', function(e) {
                var files = (e.target || {}).files || ($(this).val() ? [{name: $(this).val(), type: utils.fileMimeType($(this).val())}] : null);
                if (files) {
                    uploadContentFiles({files: files, route: '/api/replay/upload'});
                }
            });
        };

        function uploadContentFiles(params) {
            console.log('Subiendo');
            var files = params.files;
            //var post_uuid = params.post_uuid;
            //var postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
            //var textarea = postContainer.find('textarea');
            //var text = textarea.val();
            var uploadForm = $('#rfilesForm');
            var doneUploading = false;
            uploadForm.attr('action', /*config.relative_path*/ 'localhost' + params.route);
    
            /*var cid = categoryList.getSelectedCid();
            if (!cid && ajaxify.data.cid) {
                cid = ajaxify.data.cid;
            }*/

            //Checamos si tiene permiso y si es la extension correcta
            /*for (var i = 0; i < files.length; ++i) {
                var isRec = files[i].type.match(application/octet-stream);
                if ((isRec && !app.user.privileges['upload:post:image']) || (!isRec && !app.user.privileges['upload:post:file'])) {
                    return app.alertError('[[error:no-privileges]]');
                }
            }*/
    
            /*var filenameMapping = [];
    
            for (var i = 0; i < files.length; ++i) {
                // The filename map has datetime and iterator prepended so that they can be properly tracked even if the
                // filenames are identical.
                filenameMapping.push(i + '_' + Date.now() + '_' + (params.fileNames ? params.fileNames[i] : files[i].name));
                var isRec = files[i].type.match(/image./);
    
                if (files[i].size > parseInt(config.maximumFileSize, 10) * 1024) {
                    uploadForm[0].reset();
                    return app.alertError('[[error:file-too-big, ' + config.maximumFileSize + ']]');
                }
    
                text = insertText(text, textarea.getCursorPosition(), (isImage ? '!' : '') + '[' + filenameMapping[i] + '](' + uploadingText + ') ');
            }
            postContainer.find('[data-action="post"]').prop('disabled', true);
            textarea.val(text);
    
            $(window).trigger('action:composer.uploadStart', {
                post_uuid: post_uuid,
                files: filenameMapping.map(function (filename, i) {
                    return {
                        filename: filename.replace(/^\d+_\d{13}_/, ''),
                        isImage: /image./.test(files[i].type),
                    }
                }),
                text: uploadingText,
            });*/
    
            uploadForm.off('submit').submit(function() {
                console.log('Subiendo a:' + config.relative_path + params.route);
                /*function updateTextArea(filename, text, trim) {
                    var newFilename;
                    if (trim) {
                        newFilename = filename.replace(/^\d+_\d{13}_/, '');
                    }
                    var current = textarea.val();
                    var re = new RegExp(escapeRegExp(filename) + "]\\([^)]+\\)", 'g');
                    textarea.val(current.replace(re, (newFilename || filename) + '](' + text + ')'));
    
                    $(window).trigger('action:composer.uploadUpdate', {
                        post_uuid: post_uuid,
                        filename: filename,
                        text: text,
                    });
                }*/
    
                /*uploads.inProgress[post_uuid] = uploads.inProgress[post_uuid] || [];
                uploads.inProgress[post_uuid].push(1);
    
                if (params.formData) {
                    params.formData.append('cid', cid);
                }*/
    
                $(this).ajaxSubmit({
                    headers: {
                        'x-csrf-token': config.csrf_token
                    },
                    resetForm: true,
                    clearForm: true,
                    formData: params.formData,
                    /*data: { cid: cid },*/
    
                    error: function (xhr) {
                        //postContainer.find('[data-action="post"]').prop('disabled', false);
                        onUploadError(xhr);
                        console.log('Error');
                        console.log(xhr);
                    },
    
                    uploadProgress: function(event, position, total, percent) {
                        console.log('subiendo' + percent + '%');
                        /*translator.translate('[[modules:composer.uploading, ' + percent + '%]]', function(translated) {
                            if (doneUploading) {
                                return;
                            }
                            for (var i=0; i < files.length; ++i) {
                                updateTextArea(filenameMapping[i], translated);
                            }
                        });*/
                    },
    
                    success: function(uploads) {
                        doneUploading = true;
                        console.log('subido');
                        console.log(uploads);
                        /*if (uploads && uploads.length) {
                            for (var i=0; i<uploads.length; ++i) {
                                updateTextArea(filenameMapping[i], uploads[i].url, true);
                            }
                        }
                        preview.render(postContainer);
                        textarea.focus();
                        postContainer.find('[data-action="post"]').prop('disabled', false);*/
                    },
    
                    complete: function() {
                        uploadForm[0].reset();
                        console.log('completado');
                        //uploads.inProgress[post_uuid].pop();
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

        function escapeRegExp(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            console.log('escapeRegExp');
        }

        function resetInputFile($el) {
            $el.wrap('<form />').closest('form').get(0).reset();
            $el.unwrap();
            console.log('resetInputFile');
        }

    };

	Extendedsc.actions.register('replay', Replay);
})(window.Extendedsc);
<div class="modal fade" id="extendedsc-modal-extension" role="dialog" aria-labelledby="extendedscModalExtension" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="extendedscModalExtension">Upload mod</h4>
            </div>
            <div class="modal-body">
                <div class="control-group">
                    <label class="control-label" for="inputExtname">Extension name</label>
                    <div class="controls">
                        <input class="form-control" type="text" id="inputExtname" placeholder="Extension name" value="">
                    </div>
                </div>
                <select class="form-control" id="typeExt" data-property="typeExtension">
					<option value="" selected="">Default</option>
					<option value="Interface">Interface</option>
					<option value="Textures">Textures</option>
					<option value="Campaigns">Campaigns</option>
					<option value="Models">Models</option>
                    <option value="Maps/Escenaries">Maps/escenaries</option>
                    <option value="Editor">Editor</option>
				</select>
                <div class="editorBody"></div>
                <div class="checkbox">
					<label>
						<input type="checkbox" id="onlineExt" data-property="worksonline"> <strong>Compatible online</strong>
					</label>
				</div>
                <button type="button" class="btn btn-primary btn-xs">
                    <span class="fa"></span> seleccionar mod
                </button>

                <button type="button" class="btn btn-primary btn-xs">
                    <span class="fa"></span> seleccionar thumbnail
                </button>

                <button type="button" class="btn btn-primary btn-xs">
                    <span class="fa"></span> seleccionar portada 1
                </button>

                <button type="button" class="btn btn-primary btn-xs">
                    <span class="fa"></span> seleccionar portada 2
                </button>

                <button type="button" class="btn btn-primary btn-xs">
                    <span class="fa"></span> seleccionar portada 3
                </button>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="extendedsc-button-create-extension-submit">Submit</button>
            </div>
        </div>
    </div>
    <form id="extensionForm" method="post" enctype="multipart/form-data">
        <!--[if gte IE 9]><!-->
            <input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
        <!--<![endif]-->
        <!--[if lt IE 9]>
            <input type="file" id="files" name="files[]" class="lt-ie9 hide" value="Upload"/>
        <![endif]-->
    </form>
</div>



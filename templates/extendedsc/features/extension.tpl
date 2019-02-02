<div class="modal fade" id="extendedsc-modal-extension" role="dialog" aria-labelledby="extendedscModalExtension" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="extendedscModalExtension">Upload mod</h4>
            </div>
            <div class="modal-body">
                <div class="control-group">
                    <label class="control-label" for="scTitle">Extension name</label>
                    <div class="controls">
                        <input class="form-control rcFormEl" type="text" id="scTitle" name="title" placeholder="Extension name" value="">
                    </div>
                </div>
                <select class="form-control rcFormEl" id="scExtensionType" name="type" data-property="typeExtension">
                    <option value="" selected="">Default</option>
                    <option value="interface">Interface</option>
                    <option value="texture">Textures</option>
                    <option value="campaign">Campaigns</option>
                    <option value="model">Models</option>
                    <option value="map">Maps/escenaries</option>
                    <option value="editor">Editor</option>
                </select>
                <div class="editorBody"></div>
                <div class="checkbox">
                    <label>
                        <input type="checkbox" id="scWorksOnline" class="rcFormEl" name="worksonline" data-property="worksonline"> <strong>Compatible online</strong>
                    </label>
                </div>
                <button type="button" class="btn btn-primary btn-xs fileInput rcFormEl" module="file">
                    <span class="fa"></span> seleccionar mod
                </button>

                <button type="button" class="btn btn-primary btn-xs imageInput" module="picture">
                    <span class="fa"></span> seleccionar thumbnail
                </button>

                <button type="button" class="btn btn-primary btn-xs imageInput" module="frontcover">
                    <span class="fa"></span> seleccionar portada 1
                </button>

                <button type="button" class="btn btn-primary btn-xs imageInput" module="foreedge">
                    <span class="fa"></span> seleccionar portada 2
                </button>

                <button type="button" class="btn btn-primary btn-xs imageInput" module="backcover">
                    <span class="fa"></span> seleccionar portada 3
                </button>
                <form id="imagesForm" method="post">
                    <!--[if gte IE 9]><!-->
                        <input type="file" id="images" name="files[]" class="gte-ie9 hide"/>
                    <!--<![endif]-->
                    <!--[if lt IE 9]>
                        <input type="file" id="files" name="files[]" class="lt-ie9 hide" value="Upload"/>
                    <![endif]-->
                </form>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="createRcData">Submit</button>
            </div>
        </div>
    </div>
</div>



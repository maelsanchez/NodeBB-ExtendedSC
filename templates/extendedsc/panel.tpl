<div class="extendedsc" id="extendedsc-main">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">
                <a href="/extendedsc" title="Extendedsc">ExtendedSC</a>
            </h3>

            <div class="btn-group pull-right">
                <a href="#" class="extendedsc-button-settings dropdown-toggle" data-toggle="dropdown">
                    <span class="fa fa-wrench"></span>
                </a>
                <ul class="extendedsc-settings-menu dropdown-menu">
                    <li>
                        <a data-extendedsc-setting="toggles.sound" href="#">
                            <span class="fa fa-check"></span> Sound
                        </a>
                    </li>
                    <li>
                        <a data-extendedsc-setting="toggles.notification" href="#">
                            <span class="fa fa-check"></span> Notification
                        </a>
                    </li>
                    <li>
                        <a data-extendedsc-setting="toggles.hide" href="#">
                            <span class="fa fa-check"></span> Hide
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="panel-body" style="{hiddenStyle}">
            <div class="extendedsc-content-container">
                <div class="extendedsc-content-overlay">
                    <a href="#" class="extendedsc-content-overlay-close fa fa-times"></a>
                    <span class="extendedsc-content-overlay-message"></span>
                </div>
                <div class="extendedsc-content well well-sm"></div>
            </div>

            <div class="input-group">
                <input type="text" placeholder="enter message" name="extendedsc-message" class="extendedsc-message-input form-control">
                <span class="input-group-btn">
                    <button class="extendedsc-message-send-btn btn btn-primary" type="button">Send</button>
                </span>
            </div>

            <!-- IF features.length -->
            <div class="extendedsc-message-buttons">
                <!-- BEGIN features -->
                <!-- IF features.enabled -->
                <button type="button" class="extendedsc-button-{features.id} btn btn-primary btn-xs">
                    <span class="fa {features.icon}"></span> {features.button}
                </button>
                <!-- ENDIF features.enabled -->
                <!-- END features -->
            </div>
            <!-- ENDIF features.length -->

            <form id="filesForm" method="post" enctype="multipart/form-data">
                <!--[if gte IE 9]><!-->
                    <input type="file" id="files" name="files[]" class="gte-ie9 hide"/>
                <!--<![endif]-->
                <!--[if lt IE 9]>
                    <input type="file" id="files" name="files[]" class="lt-ie9 hide" value="Upload"/>
                <![endif]-->
            </form>

        </div>
    </div>
</div>
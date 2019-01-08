<!-- BEGIN shouts -->
<!-- IF !shouts.isChained -->
<a class="extendedsc-avatar {shouts.user.status} {shouts.typeClasses}" href="/user/{shouts.user.userslug}" data-uid="{shouts.fromuid}">
    <!-- IF shouts.user.picture -->
    <img class="extendedsc-avatar-image" title="{shouts.user.username}" src="{shouts.user.picture}"/>
    <!-- ELSE -->
    <div class="extendedsc-avatar-icon user-icon" title="{shouts.user.username}" style="background-color: {shouts.user.icon:bgColor};">{shouts.user.icon:text}</div>
    <!-- ENDIF shouts.user.picture -->
    <div class="extendedsc-avatar-overlay">
        <span class="extendedsc-avatar-typing">
            <i class="text-muted fa fa-keyboard-o"></i>
        </span>
    </div>
</a>

<div class="extendedsc-user {shouts.typeClasses}" data-uid="{shouts.fromuid}">
    <a href="/user/{shouts.user.userslug}">{shouts.user.username}</a>
    <span class="extendedsc-shout-timestamp">
        <small class="text-muted"><i class="fa fa-clock-o"></i> <span class="timeago timeago-update" title="{shouts.timeString}"></span> </small>
    </span>
</div>
<!-- ENDIF !shouts.isChained -->

<div class="extendedsc-shout {shouts.typeClasses}" data-sid="{shouts.sid}" data-uid="{shouts.fromuid}">
    <div class="extendedsc-shout-text">{shouts.content}</div>

    <!-- IF shouts.user.isMod -->
    <div class="extendedsc-shout-options">
        <a href="#" class="extendedsc-shout-option-edit fa fa-pencil"></a>
        <a href="#" class="extendedsc-shout-option-close fa fa-trash-o"></a>
    </div>
    <!-- ENDIF shouts.user.isMod -->
</div>
<!-- END shouts -->
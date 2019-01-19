<div component="editor" class="editor"<!-- IF !disabled --> style="visibility: inherit;"<!-- ENDIF !disabled -->>
	<div class="editor-container">
		<form id="compose-form" method="post">
			<input type="hidden" name="_csrf" value="{config.csrf_token}" />
		</form>

		<div class="title-container row">
			<!-- IF showHandleInput -->
			<div class="col-sm-3 col-md-12">
				<input class="handle form-control" type="text" tabindex="1" placeholder="[[topic:editor.handle_placeholder]]" value="{handle}" />
			</div>
			<div class="<!-- IF isTopic -->col-lg-9<!-- ELSE -->col-lg-12<!-- ENDIF isTopic --> col-md-12">
				<!-- IF isTopicOrMain -->
				<input name="title" form="compose-form" class="title form-control" type="text" tabindex="1" placeholder="[[topic:editor.title_placeholder]]" value="{topicTitle}"/>
				<!-- ELSE -->
				<span class="title">[[topic:editor.replying_to, "{topicTitle}"]]</span>
				<!-- ENDIF isTopicOrMain -->
			</div>
			<!-- ELSE -->
			<div class="<!-- IF isTopic -->col-lg-9<!-- ELSE -->col-lg-12<!-- ENDIF isTopic --> col-md-12">
				<!-- IF isTopicOrMain -->
				<input name="title" form="compose-form" class="title form-control" type="text" tabindex="1" placeholder="[[topic:editor.title_placeholder]]" value="{topicTitle}"/>
				<!-- ELSE -->
				<span class="title">[[topic:editor.replying_to, "{topicTitle}"]]</span>
				<!-- ENDIF isTopicOrMain -->
			</div>
			<!-- ENDIF showHandleInput -->
		</div>

		<div class="category-tag-row">
			<div class="btn-toolbar formatting-bar">
				<ul class="formatting-group">
					<!-- BEGIN formatting -->
						<!-- IF formatting.spacer -->
						<li class="spacer"></li>
						<!-- ELSE -->
						<!-- IF !formatting.mobile -->
						<li tabindex="-1" data-format="{formatting.name}"><i class="{formatting.className}"></i></li>
						<!-- ENDIF !formatting.mobile -->
						<!-- ENDIF formatting.spacer -->
					<!-- END formatting -->
				</ul>
			</div>
		</div>

		<div class="row write-preview-container">
			<div class="col-md-6 col-sm-12 write-container">
				<textarea name="content" form="compose-form" class="write" tabindex="5"></textarea>
			</div>
		</div>
	</div>
</div>
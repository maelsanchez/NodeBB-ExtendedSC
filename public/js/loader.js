(function() {
	$(window).on('action:widgets.loaded', function() {
		if ($('#extendedsc-main').length > 0) {
			Extendedsc.init();
		}
	});

	window.Extendedsc = {
		init: function() {
			Extendedsc.instances.main = Extendedsc.base.init($('#extendedsc-main'), {});
		},
		instances: {}
	};
})();
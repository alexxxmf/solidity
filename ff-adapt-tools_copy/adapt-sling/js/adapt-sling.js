define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var slingExtensionView = Backbone.View.extend({

		events: {
			"tap .sling-extension-button": "onSpecButtonClicked"
		},
		
		className: 'sling-extension',

		initialize: function() {
			this.render();
		},

		render: function() {
			var data = this.model.toJSON();
			var template = Handlebars.templates['sling'];

			this.$el.html(template(data)).appendTo($('.' + this.model.get('_id')));
			_.defer(_.bind(this.postRender, this));
		},

		postRender: function() {
			this.setLayout();
			this.listenTo(Adapt, 'remove', this.remove);
			this.listenTo(Adapt, 'sling-extension-widget:open', this.checkIfShouldClose);
		},

		setLayout: function() {
			if (Adapt.config.get('_defaultDirection') == 'rtl' && Adapt.device.screenSize === 'small' ) {
				$('.' + this.model.get('_id') + " .component-title-inner").css({
					paddingLeft: '35px'
				});
			} else {
				$('.' + this.model.get('_id') + " .component-title-inner").css({
					paddingRight: '35px'
				});
			}

			var $specDetail = this.$('.sling-extension-widget');

			$specDetail.velocity({ scaleX: 0, scaleY: 0 }, { duration: 1 });
		},

		onSpecButtonClicked: function(event) {
			if (event) event.preventDefault();

			var $specDetail = this.$('.sling-extension-widget');
			var closeAria = Adapt.course.get('_globals')._extensions._sling.closeButtonText;
			var openAria = Adapt.course.get('_globals')._extensions._sling.openButtonText;

			if (!$specDetail.hasClass('widget-open')) {

				$(event.currentTarget).attr({
					'aria-label': closeAria
				});
				$specDetail.velocity({
					scaleX: 1,
					scaleY: 1
				}, {
					duration: 800,
					display: 'block',
					easing: [500, 35]
				});
				$specDetail.addClass('widget-open');

				this.$('.sling-extension-button').removeClass('icon-question').addClass('icon-cross');
				Adapt.trigger('popup:opened',  this.$('.sling-extension-inner'));
				$specDetail.a11y_focus();
				Adapt.trigger('sling-extension-widget:open', this.model.get('_id'));

				// Send the URL to the host
				const triggerMessage = {
					message: 'sling',
					data: {
						action: 'open',
						url: this.model.get('_sling')[0].url
					}
				}

				const triggerData = JSON.stringify(triggerMessage);

				console.log(triggerData);

				window.postMessage(triggerData, "*");

			} else {
				$(event.currentTarget).attr({
					'aria-label': openAria
				});
				$specDetail.velocity({
					scaleX: 0,
					scaleY: 0
				}, {
					duration: 300,
					display: 'none'
				});
				$specDetail.removeClass('widget-open');

				this.$('.sling-extension-button').removeClass('icon-cross').addClass('icon-question');
				 Adapt.trigger('popup:closed',  this.$('.sling-extension-inner'));

				// Send the URL to the host
				const triggerMessage = {
					message: 'sling',
					data: {
						action: 'close',
						url: this.model.get('_sling')[0].url
					}
				}

				const triggerData = JSON.stringify(triggerMessage);

				console.log(triggerData);

				window.postMessage(triggerData, "*");
			}
		},

		checkIfShouldClose: function(id) {
			if (this.model.get('_id') !== id) {
				var $widget = $('.' + this.model.get('_id') + " .sling-extension-widget");
				var $button = $('.' + this.model.get('_id') + " .sling-extension-button");

				$widget.velocity({
					scaleX: 0,
					scaleY: 0
				}, {
					duration: 300,
					display: 'none'
				});

				$widget.removeClass('widget-open');
				$button.removeClass('icon-cross').addClass('icon-question');
			}
		}
	});

	Adapt.on('componentView:postRender', function(view) {
		if (view.model.has('_sling') && view.model.get('_sling').length > 0) {
			new slingExtensionView({
				model: view.model
			});
		}
	});

});

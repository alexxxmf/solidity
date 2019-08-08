/*
* adapt-quicknav
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define([
	'core/js/adapt'
], function(Adapt) {

	var QuickNavView = Backbone.View.extend({
		
		className: "block quicknav",

		events: {
			"click #root": "onRootClicked",
			"click #previous": "onPreviousClicked",
			"click #up": "onUpClicked",
			"click #next": "onNextClicked",
		},

		initialize: function() {
			this.listenTo(Adapt, 'remove', this.remove);
			this.render();
			this.setLocking();

			if (this.model.config._isEnableNextOnCompletion) {
				var currentPageModel = this.model.state.currentPage.model;

				if (currentPageModel.get("_isComplete")) {
					this.onPageCompleted();
				} else {
					this.listenTo(currentPageModel, "change:_isComplete", this.onPageCompleted);
				}
			}
		},

		render: function() {
			var template = Handlebars.templates["quicknav-bar"];
			this.$el.html(template(this.model));
			return this;
		},

		setLocking: function() {
			var nextModel = this.getNextPageModel();


			if (!nextModel) {
				this.$("#next").html("Complete")
				this.$("#next").attr("class", "finished")
				this.$("#next").removeAttr("disabled");
			}

			var previousModel = this.getPrevPageModel();


			if (!previousModel) {
				this.$("#previous").hide();
			}

		},

		toggleLock: function(selector, isLocked) {
			if (isLocked) {
				this.$(selector).hide();
			} else {
				this.$(selector).show();
			}
		},

		getPrevPageModel: function() {

			var params = Adapt.quicknav.getParameters();

			if (params.pages === undefined) return;

			var indexOfCurrentPage = _.indexOf(params.pages, Adapt.quicknav.state.currentPage.model.get("_id"));
			var indexOfPreviousPage = Adapt.quicknav.getPrevPageIndex(params.menus, params.indexOfMenu, params.pages, indexOfCurrentPage);

			var pageId = params.pages[indexOfPreviousPage];

			return Adapt.findById(pageId);

		},

		getNextPageModel: function() {

			var params = Adapt.quicknav.getParameters();

			if (params.pages === undefined) return;

			var indexOfCurrentPage = _.indexOf(params.pages, Adapt.quicknav.state.currentPage.model.get("_id"));
			var indexOfNextPage = Adapt.quicknav.getNextPageIndex(params.menus, params.indexOfMenu, params.pages, indexOfCurrentPage);

			var pageId = params.pages[indexOfNextPage];

			return Adapt.findById(pageId);

		},

		onRootClicked: function() {
			this.parent.onRootClicked();
		},

		onPreviousClicked: function() {
			this.parent.onPreviousClicked();
		},

		onUpClicked: function() {
			this.parent.onUpClicked();
		},

		onNextClicked: function() {
			this.parent.onNextClicked();

		},

		onPageCompleted: function() {
			this.setLocking();
		}

	});

	return QuickNavView;
});

define([
    'core/js/adapt',
    'core/js/views/componentView'
], function(Adapt, ComponentView) {

    var quicknav = ComponentView.extend({
        preRender: function() {
            this.setCompletionStatus();
        },

        postRender: function() {
            this.setReadyStatus();
        }
    });

    Adapt.register("quicknav", quicknav);

    return quicknav;
});
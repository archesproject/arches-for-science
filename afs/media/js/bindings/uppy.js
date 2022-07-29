define([
    'jquery',
    'underscore',
    'knockout',
    'js-cookie'
], function($, _, ko, Cookies) {
    /**
     * @constructor
     * @name dropzone
     */
    ko.bindingHandlers.uppy = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var innerBindingContext = bindingContext.extend(valueAccessor);
            ko.applyBindingsToDescendants(innerBindingContext, element);
            var options = valueAccessor() || {};
            const UppyContainer = window.Uppy;
            const uppy = new UppyContainer.Core({debug: true, autoProceed: true}).use(UppyContainer.Dashboard, {
                inline: options.inline,
                target: element,
                autoProceed: true,
                logger: UppyContainer.Core.debugLogger,
            }).use(UppyContainer.AwsS3Multipart, {
                companionUrl: "/",
                companionHeaders: {
                    'X-CSRFToken': Cookies.get('csrftoken')
                }
            }).use(UppyContainer.ProgressBar, {
                target: ".uppy-progress"
            });
            
            if(options.filesAdded) {
                uppy.on('complete', options.filesAdded);
            }

            return { controlsDescendantBindings: true };
        }
    };
    return ko.bindingHandlers.dropzone;
});

define([
    'jquery',
    'underscore',
    'knockout',
    'js-cookie', 
    '@uppy/core',
    '@uppy/dashboard',
    '@uppy/drag-drop',
    '@uppy/aws-s3-multipart',
    '@uppy/progress-bar'
], function($, _, ko, Cookies, uppy, Dashboard, DragDrop, AwsS3Multipart, ProgressBar) {
    /**
     * @constructor
     * @name dropzone
     */
    ko.bindingHandlers.uppy = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            const innerBindingContext = bindingContext.extend(valueAccessor);
            ko.applyBindingsToDescendants(innerBindingContext, element);
            const options = valueAccessor() || {};

            const uppyObj = new uppy({
                debug: true, 
                autoProceed: true,
                onBeforeFileAdded: (currentFile) => {
                    const name = currentFile.name.trim().replaceAll(' ', '_').replace(/(?=u)[^-\w.]/g, '');
                    const modifiedFile = {
                        ...currentFile,
                        meta: {
                            ...currentFile.meta,
                            name
                        },
                        name
                    };
                    return modifiedFile;
                },
            }).use(DragDrop, {
                inline: options.inline,
                target: element,
                autoProceed: true,
                logger: uppy.debugLogger,
            }).use(AwsS3Multipart, {
                companionUrl: "/",
                companionHeaders: {
                    'X-CSRFToken': Cookies.get('csrftoken')
                }
            }).use(ProgressBar, {
                target: ".uppy-progress"
            });
            
            if(options.filesAdded) {
                uppyObj.on('complete', options.filesAdded);
            }

            return { controlsDescendantBindings: true };
        }
    };
    return ko.bindingHandlers.dropzone;
});

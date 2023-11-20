define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'views/list',
    'views/components/functions/primary-descriptors',
    'bindings/chosen',
    'templates/views/components/functions/multicard-resource-descriptor.htm',
],
function($, _, ko, koMapping, ListView, PrimaryDescriptorsView, chosen, multicardResourceDescriptor) {
    // Get the parent component we want to inherit from from the ko registry.
    let parentComponent;
    const setParentComponent = (found) => {
        parentComponent = found;
    }
    ko.components.defaultLoader.getConfig('views/components/functions/primary-descriptors', setParentComponent);

    return ko.components.register('views/components/functions/multicard-resource-descriptor', {
        viewModel: function(params) {
            parentComponent.viewModel.apply(this, arguments);
        },
        template: multicardResourceDescriptor,
    });
});

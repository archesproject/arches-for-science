define([
    'knockout',
    'templates/views/components/resource-instance-creator.htm',
    'viewmodels/resource-instance-select',
    'bindings/select2-query',
], function(ko, resourceInstanceSelectWidgetTemplate, ResourceInstanceSelectViewModel) {
    const viewModel = function(params) {
        params.value = params.value || ko.observable();
        params.allowInstanceCreation = true;
        params.renderContext = 'workflow';
        params.datatype = 'resource-instance';
        params.disabled = params.disabled || ko.observable(false);
        ResourceInstanceSelectViewModel.apply(this, [params]);

        this.newResource = function(){
            this.select2Config.onSelect({
                "_id": params.graphids[0]
            });
        }
    };

    return ko.components.register('views/components/widgets/resource-instance-creator', {
        viewModel: viewModel,
        template: resourceInstanceSelectWidgetTemplate,
    });
});
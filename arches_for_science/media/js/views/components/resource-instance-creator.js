import ko from 'knockout';
import resourceInstanceSelectWidgetTemplate from 'templates/views/components/resource-instance-creator.htm';
import ResourceInstanceSelectViewModel from 'viewmodels/resource-instance-select';
import 'bindings/select2-query';

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

export default ko.components.register('views/components/widgets/resource-instance-creator', {
    viewModel: viewModel,
    template: resourceInstanceSelectWidgetTemplate,
});
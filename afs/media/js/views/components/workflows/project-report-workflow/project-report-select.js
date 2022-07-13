define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
], function(_, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;
        this.projectValue = ko.observable();
        this.templateValue = ko.observable();
        this.locked = ko.observable(false);
        this.select2Config = {
            value: self.value,
            clickBubble: true,
            multiple: false,
            closeOnSlect: false,
            placeholder: self.placeholder,
            allowClear: true,
            ajax: {
                url: arches.urls.reports,
                dataType: 'json',
                quietMillis: 250,
                results: (data) => {
                    return {
                        results: Object.keys(data).map(key => {
                            return {
                                id: key,
                                text: key
                            };
                        })
                    };
                }
            },
        };

        this.saveValues = function(){ //save the savedData and finalize the step
            params.form.savedData({
                tileData: koMapping.toJSON(self.tile().data),
                resourceInstanceId: self.tile().resourceinstance_id,
                tileId: self.tile().tileid,
                nodegroupId: self.tile().nodegroup_id,
                fileTileData: ko.unwrap(self.fileTileData),
            });
            self.locked(true);
            params.form.complete(true);
            params.form.saving(false);
        };

        this.templateValue.subscribe(() => {
            params.value({
                project: this.projectValue(),
                template: this.templateValue()
            });
        })
    };

    ko.components.register('project-report-select', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/project-report-workflow/project-report-select.htm'
        }
    });

    return viewModel;
});
define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'templates/views/components/workflows/project-report-workflow/report-template-select.htm'
], function(_, arches, ko, koMapping, reportTemplateSelectTemplate) {
    function viewModel(params) {
        var self = this;
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
                url: arches.urls.reports_list,
                dataType: 'json',
                quietMillis: 250,
                results: (data) => {
                    return {
                        results: data.map(template => {
                            return {
                                id: template.templateid,
                                text: template.name,
                                description: template.description,
                                template: template,
                                preview: template.preview,
                                thumbnail: template.thumbnail,
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
                template: this.templateValue()
            });
        });
    }

    ko.components.register('report-template-select', {
        viewModel: viewModel,
        template: reportTemplateSelectTemplate
    });

    return viewModel;
});
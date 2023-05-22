define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'templates/views/components/workflows/project-report-workflow/project-report-select.htm'
], function(_, arches, ko, koMapping, projectReportSelectTemplate) {
    function viewModel(params) {
        var self = this;
        this.projectValue = ko.observable();
        this.locked = ko.observable(false);
        
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

        this.projectValue.subscribe(() => {
            if (this.projectValue()) {
                params.value({
                    project: this.projectValue()
                });
            }
        });
    }

    ko.components.register('project-report-select', {
        viewModel: viewModel,
        template: projectReportSelectTemplate
    });

    return viewModel;
});
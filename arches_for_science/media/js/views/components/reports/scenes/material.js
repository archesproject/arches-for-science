define(['underscore',
    'knockout',
    'templates/views/components/reports/scenes/material.htm',
    'arches',
    'utils/report',
    'bindings/datatable'
], function(_, ko, materialSceneTemplate, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/material', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.visible = {
                elements: ko.observable(true),
                materialStatement: ko.observable(true)
            }
            self.cards = Object.assign({}, params.cards);
            self.elements = params.data().material?.concept_details || null;
            self.materialStatement = params.data()?.material?.material_data_assignment?.material_data_assignment_statement?.material_data_assignment_statement_content["@display_value"] || "";
        },
        template: materialSceneTemplate
    });
});
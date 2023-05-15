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

        this.templates = ko.observableArray();
        this.getTemplates = async () => {
            try {
                const response = await fetch(arches.urls.reports_list);
                const data = await response.json();
                this.templates(data.map(template => {
                    return {
                        id: template.templateid,
                        name: template.name,
                        description: template.description,
                        template: template,
                        preview: `/files/${template.preview}`,
                        thumbnail: `/files/${template.thumbnail}`,
                    };
                }));
            } catch (error) {
                console.error('Error: ', error);
            }
        };
        this.getTemplates();

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
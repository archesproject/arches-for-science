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

        let arches_templates = [];
        this.allTemplateFormats = ko.observableArray();
        this.pptTemplates = ko.observableArray();
        this.docxTemplates = ko.observableArray(); 
        // this.xlsxTemplates = ko.observableArray();

        this.getTemplates = async () => {
            try {
                const response = await fetch(arches.urls.reports_list);
                const data = await response.json();
                arches_templates = data.map(template => {
                        return {
                            id: template.templateid,
                            name: template.name,
                            format: template.template.split('.').pop(),
                            description: template.description,
                            template: template,
                            preview: `/files/${template.preview}`,
                            thumbnail: `/files/${template.thumbnail}`,
                        };
                });
                this.pptTemplates(arches_templates.filter(template => template.format === 'pptx'));
                this.docxTemplates(arches_templates.filter(template => template.format === 'docx'));
                // this.xlsxTemplates(arches_templates.filter(template => template.format === 'xlsx'));

                this.allTemplateFormats([
                    {
                        heading: 'Word Templates',
                        templates: this.pptTemplates()
                    },
                    {
                        heading: 'Powerpoint Templates',
                        templates: this.docxTemplates()
                    },
                    // {
                    //     heading: 'Excel Templates',
                    //     templates: this.xlsxTemplates()
                    // },
                ])
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
define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'templates/views/components/workflows/project-report-workflow/report-template-select.htm'
], function(_, arches, ko, koMapping, reportTemplateSelectTemplate) {
    function viewModel(params) {
        this.templateValue = ko.observable();

        let archesTemplates = [];
        this.allTemplateFormats = ko.observableArray();
        this.pptTemplates = [];
        this.docxTemplates = []; 
        // this.xlsxTemplates = [];

        this.getTemplates = async() => {
            try {
                const response = await fetch(arches.urls.reports_list);
                const data = await response.json();
                archesTemplates = data.map(template => {
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
                this.pptTemplates = archesTemplates.filter(template => template.format === 'pptx');
                this.docxTemplates = archesTemplates.filter(template => template.format === 'docx');
                // this.xlsxTemplates = archesTemplates.filter(template => template.format === 'xlsx');

                this.allTemplateFormats([
                    {
                        heading: 'Word Templates',
                        templates: this.pptTemplates,
                    },
                    {
                        heading: 'Powerpoint Templates',
                        templates: this.docxTemplates,
                    },
                    // {
                    //     heading: 'Excel Templates',
                    //     templates: this.xlsxTemplates,
                    // },
                ]);
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
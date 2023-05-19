define([
    'underscore',
    'arches',
    'knockout',
    'jquery',
    'templates/views/components/workflows/project-report-workflow/report-template-select.htm'
], function(_, arches, ko, $, reportTemplateSelectTemplate) {
    function viewModel(params) {
        this.templateValue = ko.observable();
        this.previewSelected = ko.observable(false);
        this.preview = ko.observable();

        this.showPDFPreview = function(preview) {
            if(preview !== null){
                this.preview(preview);
            }
            this.previewSelected(!this.previewSelected());
            $('#pdf-preview-modal').modal('toggle');
        };

        let archesTemplates = [];
        this.allTemplateFormats = ko.observableArray();
        this.pptTemplates = [];
        this.docxTemplates = []; 
        // this.xlsxTemplates = [];

        this.getTemplates = async() => {
            const response = await fetch(arches.urls.reports_list);
            const data = await response.json();
            archesTemplates = data.map(template => {
                if(!template.thumbnail){
                    template.thumbnail = {
                        'name': null,
                        'url': null
                    }
                }
                if(!template.preview){
                    template.preview = {
                        'name': null,
                        'url': null
                    }
                }
                return {
                    id: template.templateid,
                    name: template.name,
                    format: template.template.name.split('.').pop(),
                    description: template.description,
                    template: template.template.url,
                    preview: template.preview.url,
                    thumbnail: template.thumbnail.url,
                };
            });
            this.docxTemplates = archesTemplates.filter(template => template.format === 'docx');
            this.pptTemplates = archesTemplates.filter(template => template.format === 'pptx');
            // this.xlsxTemplates = archesTemplates.filter(template => template.format === 'xlsx');

            this.allTemplateFormats([
                {
                    heading: 'Word Templates',
                    templates: this.docxTemplates,
                    icon: 'fa fa-file-word-o',
                },
                {
                    heading: 'Powerpoint Templates',
                    templates: this.pptTemplates,
                    icon: 'fa fa-file-powerpoint-o',
                },
                // {
                //     heading: 'Excel Templates',
                //     templates: this.xlsxTemplates,
                //     icon: 'fa fa-file-excel-o',
                // },
            ]);
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
define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'js-cookie',
    'templates/views/components/workflows/project-report-workflow/generate-report.htm'
], function(_, arches, ko, koMapping, cookies, generateReportTemplate) {
    function viewModel(params) {
        const self = this;
        const project = params.projectId;
        const template = params.templateId;
        const regex = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i;
        const data = {
            projectid: project, 
            templateid: template
        };

        this.downloadLink = ko.observable();
        this.downloadName = ko.observable();

        const generateReport = async() => {
            const result = await fetch(arches.urls.reports, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": cookies.get('csrftoken')
                },
                body: JSON.stringify(data)
            });
            const blobResult = await result.blob();
            self.downloadLink(URL.createObjectURL(blobResult));
            result.headers.forEach(header => {
                if (header.match(regex)) {
                    self.downloadName(header.match(regex)[1]);
                }
            });
        };

        generateReport();
    };

    ko.components.register('generate-report', {
        viewModel: viewModel,
        template: generateReportTemplate
    });

    return viewModel;
});
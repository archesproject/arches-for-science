define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'js-cookie',
    'utils/report',
    'templates/views/components/workflows/project-report-workflow/download-report.htm'
], function(_, arches, ko, koMapping, cookies, reportUtils, downloadReportTemplate) {
    function viewModel(params) {
        const self = this;
        const projectId = params.projectId;
        this.templates = ko.observableArray(params.templates);
        const annotationScreenshots = params.annotationScreenshots;
        const physicalThings = params.physicalThings;
        const lbgApiEndpoint = `${arches.urls.api_bulk_disambiguated_resource_instance}?v=beta&resource_ids=`;
        const physicalThingDetailsUrl = physicalThings.reduce(
            (acc, current) => acc + current.resourceinstanceid + ",", 
            lbgApiEndpoint
        ).replace(/,$/, '');
        const projectDetailsUrl = lbgApiEndpoint + projectId;
        
        const regex = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i;


        this.downloadInfo = ko.observableArray();
        this.projectName = ko.observable();

        const getProjectName = async() => {
            const response = await fetch(`${arches.urls.api_resources(projectId)}?format=json`);
            const data = await response.json();
            self.projectName(data.displayname);
        };
        getProjectName();

        const generateReport = async(template) => {
            const physicalThingsDetails = await (await window.fetch(physicalThingDetailsUrl)).json();

            const projectDetails = await (await window.fetch(projectDetailsUrl)).json();
            
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const reportDate = today.toLocaleDateString('en-US', options);
            const filename = reportUtils.slugify(`${self.projectName()}_${template.name}_${reportDate}`);
            const data = {
                projectId,
                templateId: template.id,
                filename: filename,
                annotationScreenshots,
                reportDate,
                projectDetails: [...Object.values(projectDetails)],
                physicalThingsDetails: [...Object.values(physicalThingsDetails)]
            };

            const result = await fetch(arches.urls.reports(template.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": cookies.get('csrftoken')
                },
                body: JSON.stringify(data)
            });

            const blobResult = await result.blob();
            let downloadName;
            result.headers.forEach(header => {
                if (header.match(regex)) {
                    downloadName = header.match(regex)[1];
                }
            });

            this.downloadInfo.push({
                downloadLink: URL.createObjectURL(blobResult),
                downloadName: downloadName,
                templateName: template.name,
            });
        };

        this.templates().forEach(template => {
            generateReport(template);
        });
    }

    ko.components.register('download-report', {
        viewModel: viewModel,
        template: downloadReportTemplate
    });

    return viewModel;
});
define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'js-cookie',
    'templates/views/components/workflows/project-report-workflow/download-report.htm'
], function(_, arches, ko, koMapping, cookies, downloadReportTemplate) {
    function viewModel(params) {
        const self = this;
        const projectId = params.projectId;
        const templateId = params.templateId;
        const annotationScreenshots = params.annotationScreenshots;
        const physicalThings = params.physicalThings;
        const lbgApiEndpoint = `${arches.urls.api_bulk_disambiguated_resource_instance}?v=beta&resource_ids=`;
        const physicalThingDetailsUrl = physicalThings.reduce(
            (acc, current) => acc + current.resourceinstanceid + ",", 
            lbgApiEndpoint
        ).replace(/,$/, '');
        const projectDetailsUrl = lbgApiEndpoint + projectId;
        
        const regex = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i;


        this.downloadLink = ko.observable();
        this.downloadName = ko.observable();

        const generateReport = async() => {
            const physicalThingsDetails = await (await window.fetch(physicalThingDetailsUrl)).json();

            const projectDetails = await (await window.fetch(projectDetailsUrl)).json();
            
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const reportDate = today.toLocaleDateString('en-US', options);
            const data = {
                projectId,
                templateId,
                annotationScreenshots,
                reportDate,
                projectDetails: [...Object.values(projectDetails)],
                physicalThingsDetails: [...Object.values(physicalThingsDetails)]
            };

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
    }

    ko.components.register('download-report', {
        viewModel: viewModel,
        template: downloadReportTemplate
    });

    return viewModel;
});
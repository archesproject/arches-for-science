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
        const observationGraphId = "615b11ee-c457-11e9-910c-a4d18cec433a";
        const collectionGraphId = "1b210ef3-b25c-11e9-a037-a4d18cec433a";
        const physicalThingGraphId = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a";
        const removalFromObjectNodegroupId = "b11f217a-d2bc-11e9-8dfa-a4d18cec433a";
        const removedFromNodeId = "38814345-d2bd-11e9-b9d6-a4d18cec433a";

        const self = this;
        const projectId = params.projectId;
        const physicalThingFromPreviousStep = params.physicalThingIds;
        this.templates = ko.observableArray(params.templates);
        const screenshots = params.annotationStepData ? params.annotationStepData.screenshots : [];
        const lbgApiEndpoint = `${arches.urls.api_bulk_disambiguated_resource_instance}?v=beta&resource_ids=`;
        const projectDetailsUrl = lbgApiEndpoint + projectId;
        
        const regex = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i;

        this.downloadInfo = ko.observableArray();
        this.errorInfo = ko.observableArray();
        this.projectName = ko.observable();

        const getRelatedResources = async function(resourceid) {
            const response = await window.fetch(arches.urls.related_resources + resourceid + "?paginate=false");

            if (response.ok) {
                return await response.json();
            } else { 
                throw('error retrieving related resources', response); // throw - this should never happen. 
            }

        };

        const getProjectName = async() => {
            const response = await fetch(`${arches.urls.api_resources(projectId)}?format=json`);
            const data = await response.json();
            self.projectName(data.displayname);
        };
        getProjectName();

        const generateReport = async(template) => {
            const relatedObjects = await getRelatedResources(projectId);
            const collections = relatedObjects.related_resources.filter(rr => rr.graph_id == collectionGraphId);
            const allPhysicalThingsResponse = collections.map(async(collection) => {
                const collectionRelatedResources = await getRelatedResources(collection.resourceinstanceid);
                return collectionRelatedResources?.related_resources.filter(rr => rr.graph_id == physicalThingGraphId);
            });

            self.physicalThings = [].concat(...(await Promise.all(allPhysicalThingsResponse))).filter(res => {
                const removedFromTile = res.tiles.find(tile => tile.nodegroup_id === removalFromObjectNodegroupId);
                const removedFrom = removedFromTile?.data[removedFromNodeId].map(rr => rr.resourceId);
                return removedFrom?.some(res => physicalThingFromPreviousStep.includes(res)) || physicalThingFromPreviousStep.includes(res.resourceinstanceid);
            });

            const physicalThingDetailsUrl = self.physicalThings.reduce(
                (acc, current) => acc + current.resourceinstanceid + ",", 
                lbgApiEndpoint
            ).replace(/,$/, '');

            const observations = relatedObjects.related_resources.filter(resource => resource.graph_id == observationGraphId);
            
            const observationIds = observations.reduce((accumulator, currentValue)=> {
                accumulator.push(currentValue.resourceinstanceid);
                return accumulator;
            }, []).join(",");
            
            const observationDetails = observationIds ? await (await window.fetch(`${lbgApiEndpoint}${observationIds}`)).json() : {};
            const physicalThingsDetails = await (await window.fetch(physicalThingDetailsUrl)).json();
            const projectDetails = await (await window.fetch(projectDetailsUrl)).json();
            
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const reportDate = today.toLocaleDateString('en-US', options);
            const filename = reportUtils.slugify(`${self.projectName()}_${template.name}_${reportDate}`);
            const physicalThingsDetailsArray = [...Object.values(physicalThingsDetails)];
            const objectOfStudyDetailsArray = physicalThingsDetailsArray.filter(thing => physicalThingFromPreviousStep.includes(thing.resourceinstanceid));
            const analysisAreas = physicalThingsDetailsArray.filter(physicalThing => physicalThing.resource?.type?.["@display_value"] == 'analysis areas');
            const annotationScreenshots = screenshots?.map((screenshot) => {
                const url = `${window.location.origin}/temp_file/${screenshot.fileId}`;
                return {...screenshot, url};
            });
            const data = {
                projectId,
                templateId: template.id,
                filename,
                annotationScreenshots,
                reportDate,
                analysisAreas,
                observationDetails: [...Object.values(observationDetails)],
                projectDetails: [...Object.values(projectDetails)],
                physicalThingsDetails: physicalThingsDetailsArray,
                objectOfStudyDetails: objectOfStudyDetailsArray
            };

            const result = await fetch(arches.urls.reports(template.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": cookies.get('csrftoken')
                },
                body: JSON.stringify(data)
            });

            if(result.ok){
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
            } else {
                this.errorInfo.push({
                    templateName: template.name,
                })
            }
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
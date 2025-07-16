define([
    'underscore',
    'arches',
    'knockout',
    'js-cookie',
    'utils/report',
    'viewmodels/alert-json',
    'templates/views/components/workflows/project-report-workflow/download-report.htm'
], function(_, arches, ko, cookies, reportUtils, JsonErrorAlertViewModel, downloadReportTemplate) {
    function viewModel(params) {
        const observationGraphId = "615b11ee-c457-11e9-910c-a4d18cec433a";
        const collectionGraphId = "1b210ef3-b25c-11e9-a037-a4d18cec433a";
        const physicalThingGraphId = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a";

        const ramanConceptValueId = "6418248a-bcf5-408b-9bed-2dbfc996f922";
        const xrfConceptValueId = "c8d6ea37-ebd1-45df-ae96-bfd8201c3f99";

        const self = this;
        const projectId = params.projectId;
        const physicalThingFromPreviousStep = params.physicalThingIds;
        const projectFiles = params.projectFiles;
        this.message = ko.observable();
        this.loading = ko.observable(false);
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
                throw('error retrieving related resources', response); // throw - this should never happen, therefore not i18n'd.
            }

        };

        const getProjectName = async() => {
            const response = await fetch(`${arches.urls.api_resources(projectId)}?format=json`);
            const data = await response.json();
            self.projectName(data.displayname);
        };
        getProjectName();

        this.generateReport = async() => {
            self.loading(true);
            self.message(arches.translations.generatingReportMessage)
            const relatedObjects = await getRelatedResources(projectId);
            const collections = relatedObjects.related_resources.filter(rr => rr.graph_id == collectionGraphId);
            const allPhysicalThingsResponse = collections.map(async(collection) => {
                const collectionRelatedResources = await getRelatedResources(collection.resourceinstanceid);
                return collectionRelatedResources?.related_resources.filter(rr => rr.graph_id == physicalThingGraphId);
            });

            self.physicalThings = [].concat(...(await Promise.all(allPhysicalThingsResponse))).filter(res => {
                return physicalThingFromPreviousStep.includes(res.resourceinstanceid);
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
            // TODO(i18n) -- can we get the locale from django?
            const reportDate = today.toLocaleDateString('en-US', options);
            const physicalThingsDetailsArray = [...Object.values(physicalThingsDetails)];
            const objectOfStudyDetailsArray = physicalThingsDetailsArray.filter(thing => physicalThingFromPreviousStep.includes(thing.resourceinstanceid));
            const analysisAreas = physicalThingsDetailsArray.filter(physicalThing => physicalThing.resource?.type?.["@display_value"] == 'analysis areas');
            const annotationScreenshots = screenshots?.map((screenshot) => {
                const url = `${window.location.origin}/temp_file/${screenshot.fileId}`;
                return {...screenshot, url};
            });
            const files = projectFiles;

            const templates = self.templates().map((template) => ({
                templateId: template.id,
                filename: reportUtils.slugify(`${self.projectName()}_${template.name}_${reportDate}`)
            }));

            data = {
                projectId,
                templates,
                annotationScreenshots,
                reportDate,
                analysisAreas,
                ramanObservationDetails: [
                    ...Object.values(observationDetails).filter(observationDetail => {
                        return observationDetail.resource?.type?.concept_details.some(
                            conceptDetail => conceptDetail.valueid === ramanConceptValueId
                        );
                    })
                ],
                xrfObservationDetails: [
                    ...Object.values(observationDetails).filter(observationDetail => {
                        return observationDetail.resource?.type?.concept_details.some(
                            conceptDetail => conceptDetail.valueid === xrfConceptValueId
                        );
                    })
                ],
                instruments: Object.values(observationDetails).uniqueBy(
                    obs => obs["resource"]?.["used instrument"]["@display_value"]
                ).map(obs => obs["resource"]?.["used instrument"]),
                projectDetails: [...Object.values(projectDetails)],
                physicalThingsDetails: physicalThingsDetailsArray,
                objectOfStudyDetails: objectOfStudyDetailsArray,
                files: files
            };

            window.fetch(arches.urls.download_project_files, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(data),
                headers: {
                    "X-CSRFToken": cookies.get('csrftoken')
                }
            }).then(response => {
                if (response.ok) {
                    self.loading(false);
                    return response.json();
                } else {
                    throw response;
                }
            })
            .then((json) => self.message(json.message))
            .catch((response) => {
                self.loading(false);
                response.json().then(
                    error => {
                        params.pageVm.alert(
                            new JsonErrorAlertViewModel(
                                'ep-alert-red',
                                error,
                                null,
                                function(){}
                            )
                        );
                    });
            });
        };
    }

    ko.components.register('download-report', {
        viewModel: viewModel,
        template: downloadReportTemplate
    });

    return viewModel;
});
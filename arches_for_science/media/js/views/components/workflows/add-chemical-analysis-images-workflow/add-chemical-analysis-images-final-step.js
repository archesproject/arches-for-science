import ko from 'knockout';
import _ from 'underscore';
import uuid from 'uuid';
import arches from 'arches';
import SummaryStep from 'views/components/workflows/summary-step';
import addChemicalAnalysisImagesFinalStepTemplate from 'templates/views/components/workflows/add-chemical-analysis-images-workflow/add-chemical-analysis-images-final-step.htm';
import 'views/components/annotation-summary';

function viewModel(params) {
    var self = this;
    params.form.resourceId(params.relatedProjectData.observation);
    self.relatedDigitalResources = ko.observableArray()
    self.workflowManifestResource = ko.observable()
    self.digitalResourcesIds = params.digitalResourcesIds.digitalResourceInstancesIds;
    self.manifestResourceId = params.manifestResourceId.ManifestResourceId;

    SummaryStep.apply(this, [params]);

    self.loading(true);

    this.resourceData.subscribe(async function(val){
        this.displayName = val['displayname'] || 'unnamed';
        this.reportVals = {
            projectName: {'name': arches.translations.project, 'value': params.relatedProjectData.projectName, 'resourceid': params.relatedProjectData.project},
            observationName: {'name': arches.translations.observation, 'value': params.relatedProjectData.observationName, 'resourceid': params.relatedProjectData.observation},
        };
        
        await getWorkflowManifestResource();

        this.loading(false);
    }, this);

    this.getWorkflowResourceData = async function(resourceid) {
        const response = await window.fetch(this.urls.api_resources(resourceid) + '?format=json&compact=false&v=beta')
        return await response.json()
    };
    
    async function getWorkflowManifestResource() {
        self.workflowManifestResource(await self.getWorkflowResourceData(self.manifestResourceId))
    };
}

ko.components.register('add-chemical-analysis-images-final-step', {
    viewModel: viewModel,
    template: addChemicalAnalysisImagesFinalStepTemplate
});
export default viewModel;
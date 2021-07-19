define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'views/components/workflows/summary-step',
    'utils/resource',
], function($, _, ko, arches, SummaryStep, resourceUtils) {

    function viewModel(params) {
        var self = this;
        params.form.resourceId(params.form.externalStepData.selectobjectstep.data["sample-object-resource-instance"][0][1][0].resourceId)
        SummaryStep.apply(this, [params]);
        this.selectedDatasets = params.form.externalStepData.selecteddatasets.data["dataset-select-instance"].map(function (val) {
            return val[1][0]['resourceid']
        });
        this.selectedDatasetData = ko.observableArray([]);
        
        $.ajax({
            url: arches.urls.api_resources(this.selectedDatasets[0]) + '?format=json'
        }).done(function(data) {
            self.selectedDatasetData.push(data);
        });

        this.resourceData.subscribe(function(val){
            var description = val.resource['Descriptions'] && val.resource['Descriptions'].length ? val.resource['Descriptions'][0] : {};

            this.reportVals = {
                objectName: val['displayname'],
            };

            try {
                this.reportVals.references = val.resource['References'].map(function(ref){
                    return {
                        referenceName: {'name': 'Reference', 'value': self.getResourceValue(ref, ['Agency Identifier', 'Reference', '@value'])},
                        referenceType: {'name': 'Reference Type', 'value': self.getResourceValue(ref, ['Agency Identifier', 'Reference Type', '@value'])},
                        agency: {'name': 'Agency', 'value': self.getResourceValue(ref, ['Agency', '@value'])}
                    };
                })
            } catch(e) {
                this.reportVals.references = [];
            }

            this.loading(false);
        }, this);
    }

    ko.components.register('review-dataset-final-step', {
        viewModel: viewModel,
        template: { 
            require: 'text!templates/views/components/workflows/review-dataset/review-dataset-final-step.htm' 
        }
    });
    return viewModel;
});

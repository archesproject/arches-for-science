define([
    'knockout',
    'underscore',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(ko, _, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;
        SummaryStep.apply(this, [params]);

        /* this function will find a relavent statement from many statements available */
        this.findStatementType= function(val, type){
            try {
                self.reportVals.statements = val.resource['Statement'].map(function(val){
                    return {
                        content:  {'name': 'Instrument Parameters', 'value': self.getResourceValue(val, ['content','@value'])},
                        type: {'name': 'type', 'value': self.getResourceValue(val, ['type','@value'])}
                    };
                });
            } catch(e) {
                console.log(e);
                self.reportVals.statements = [];
            }
            var foundStatement = _.find(self.reportVals.statements, function(statement) {
                return statement.type.value.split(",").indexOf(type) > -1;
            })
            self.reportVals.statement = foundStatement ? foundStatement.content : {'name': 'Instrument Parameters', 'value': 'None'};
        }

        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                observationName: {'name': 'Experiment/Observation Name', 'value': this.getResourceValue(val.resource['Name'][0], ['content','@value'])},
                project: {'name': 'Project', 'value': this.getResourceValue(val.resource, ['part of','@value'])},
                usedObject: {'name': 'Used Object', 'value': this.getResourceValue(val.resource, ['observed','@value'])},
                usedInstrument: {'name': 'Instrument', 'value': this.getResourceValue(val.resource, ['used instrument','@value'])},
                usedProcess: {'name': 'Technique', 'value': this.getResourceValue(val.resource, ['used process','@value'])},
            };

            this.findStatementType(val, 'materials/technique description')

            /*var annotationStr = self.getResourceValue(val.resource['Sampling Unit'][0],['Sampling Area','Sampling Area Identification','Sampling Area Visualization','@value']);
            if (annotationStr){
                var annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                this.prepareAnnotation(annotationJson);
            }*/
        
            this.loading(false);
        }, this);
    }

    ko.components.register('upload-dataset-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/upload-dataset/upload-dataset-final-step.htm' }
    });
    return viewModel;
});

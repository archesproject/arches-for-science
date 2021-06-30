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

        this.resourceLoading = ko.observable(true);
        this.parentPhysThingLoading = ko.observable(true);
        this.digitalResourceLoading = ko.observable(true);

        //var parentPhysThingResourceId = params.form.externalStepData.projectinfo.data['select-phys-thing-step'][0][1].physicalThing;
        var parentPhysThingResourceId = 'abb69704-becc-4f35-9987-90fc0800cd8e' //sample data
        this.parentPhysThingData = ko.observableArray();
        this.parentPhysThingRelatedData = ko.observableArray();
        this.parentPhysThingAnnotations = ko.observableArray();
        this.fileList = ko.observableArray();
        this.fileList1 = ko.observableArray();

        this.getResourceData(parentPhysThingResourceId, this.parentPhysThingData);

        this.parentPhysThingData.subscribe(function(val){
            val.resource['Part Identifier Assignment'].forEach(function(annotation){
                var currentAnnotationNames = [];
                var annotationName = self.getResourceValue(annotation,['Part Identifier Assignment_Physical Part of Object','@value']);
                //if (annotationName in currentAnnotationNames) {
                    var annotationLabel = self.getResourceValue(annotation,['Part Identifier Assignment_Label','@value']);
                    var annotator = self.getResourceValue(annotation,['Part Identifier Assignment_Annotator','@value']);
                    var annotationStr = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@value']);
                    if (annotationStr) {
                        var annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                        var leafletConfig = self.prepareAnnotation(annotationJson);
                    }

                    self.parentPhysThingAnnotations.push({
                        name: annotationName,
                        label: annotationLabel,
                        annotator: annotator,
                        leafletConfig: leafletConfig,
                    });
                //}
            });
            this.parentPhysThingLoading(false);
            if (!this.resourceLoading() && !this.digitalResourceLoading() ){
                this.loading(false);
            }
        }, this);
        
        /*
        If we have to use related resource endpoint of the parent physical thing... */

        var fileNodeId = '7c486328-d380-11e9-b88e-a4d18cec433a';
        this.getRelatedResources(parentPhysThingResourceId, this.parentPhysThingRelatedData);

        this.parentPhysThingRelatedData.subscribe(function(val){
            val['related_resources'].forEach(function(rr){
                if (rr.resourceinstanceid === digitalResourceId){
                    rr.tiles.forEach(function(tile){
                        if (tile.data[fileNodeId]){
                            tile.data[fileNodeId].forEach(function(file){
                                self.fileList.push({
                                    'name': file.name,
                                    'size': file.size,
                                    'url': file.url,
                                });
                            });
                        }
                    });
                }
            })

            this.digitalResourceLoading(false);
            if (!this.resourceLoading() && !this.parentPhysThingLoading()){
                this.loading(false);
            }
        }, this);

        //var digitalResourceId = params.form.externalStepData.digitalresource.data['object-sample-location'][0][1].digitalResource;
        var digitalResGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a'; //graph id of digital resources
        var digitalResourceId = ['49b9afd2-65d1-4a2e-8777-7246a0f7b81e']; //sample data
        this.digitalResourceData = ko.observableArray();
        this.getResourceData(digitalResourceId, this.digitalResourceData);

        /*
        this.digitalResourceData.subscribe(function(val){
            var findStatementType= function(val, type){
                try {
                    self.digitalResourceData.statements = val.resource['FIle_Statement'].map(function(val){
                    return {
                        content:  {'name': 'statement', 'value': self.getResourceValue(val, ['FIle_Statement_content','@value'])},
                        type: {'name': 'type', 'value': self.getResourceValue(val, ['FIle_Statement_type','@value'])}
                    };
                });
                } catch(e) {
                    console.log(e);
                    self.reportVals.statements = [];
                }

                var foundStatement = _.find(self.digitalResourceData.statements, function(statement) {
                    return statement.type.value.split(",").indexOf(type) > -1;
                })
                return foundStatement ? foundStatement.content : {'name': 'statement', 'value': 'None'};
            }

            var file = val.resource['File']

            var digitalResourceName = val.displayName;
            var fileInterpretation = findStatementType(val, 'interpretation');
            var fileParameter = findStatementType(val, 'materials/technique description');
            self.fileList1.push({
                digitalResourceName: digitalResourceName,
                name: fileName,
                interpretation: fileInterpretation,
                parameter: fileParameter,
            });

            this.digitalResourceLoading(false);
            if (!this.resourceLoading() && !this.parentPhysThingLoading()){
                this.loading(false);
            }
        }, this);
        */

        this.resourceData.subscribe(function(val){ //this is the observation resource data
            var findStatementType= function(val, type){
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
                return foundStatement ? foundStatement.content : {'name': 'Instrument Parameters', 'value': 'None'};
            }
    
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                observationName: {'name': 'Experiment/Observation Name', 'value': this.getResourceValue(val.resource['Name'][0], ['content','@value'])},
                project: {'name': 'Project', 'value': this.getResourceValue(val.resource, ['part of','@value'])},
                usedObject: {'name': 'Used Object', 'value': this.getResourceValue(val.resource, ['observed','@value'])},
                usedInstrument: {'name': 'Instrument', 'value': this.getResourceValue(val.resource, ['used instrument','@value'])},
                usedProcess: {'name': 'Technique', 'value': this.getResourceValue(val.resource, ['used process','@value'])},
            };

            self.reportVals.statement = findStatementType(val, 'materials/technique description')

            this.resourceLoading(false);
            console.log("resourceData loaded")
            if (!this.parentPhysThingLoading() && !this.digitalResourceLoading()){
                this.loading(false);
            }
        }, this);
    }

    ko.components.register('upload-dataset-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/upload-dataset/upload-dataset-final-step.htm' }
    });
    return viewModel;
});

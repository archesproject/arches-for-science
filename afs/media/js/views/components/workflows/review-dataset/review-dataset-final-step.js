define([
    'jquery',
    'underscore',
    'knockout',
    'views/components/workflows/summary-step',
], function($, _, ko, SummaryStep) {

    function viewModel(params) {
        var self = this;

        this.loading = ko.observable(true);
        this.digitalResourceLoading = ko.observable(true);
        this.resourceLoading = ko.observable(true);
        this.fileLists = ko.observableArray();

        this.tableConfig = {
            "info": false,
            "paging": false,
            "scrollCollapse": true,
            "searching": false,
            "ordering": false,
            "columns": [
                null,
                null,
                null,
            ]
        };

        params.form.resourceId(params.sampleObjectResourceInstanceId);
        SummaryStep.apply(this, [params]);
        this.selectedDatasets = params.selectedDatasets.reduce(
            (acc, resource) => {
                if (resource.resourceid &&  resource.selected) { 
                    acc.push(resource.resourceid);
                }
                return acc;
            }, 
            []
        );

        this.selectedDatasets.forEach(function(resourceid){
            var selectedDatasetData = ko.observableArray();
            var fileList = ko.observableArray();
    
            self.getResourceData(resourceid, selectedDatasetData);
            selectedDatasetData.subscribe(function(val){
                var findStatementType= function(statements, type){
                    var foundStatement = _.find(statements, function(statement) {
                        return statement.type.indexOf(type) > -1;
                    });
                    return foundStatement ? foundStatement.statement : "None";
                };

                var digitalResourceName = val.displayname;

                var files = val.resource['File'].map(function(file){
                    var statements = [];
                    var fileName = self.getResourceValue(file['file_details'][0], ['name']);
                    if (Array.isArray(file["FIle_Statement"])) {
                        statements = file["FIle_Statement"].map(function(statement){
                            return {
                                statement: self.getResourceValue(statement, ['FIle_Statement_content','@display_value']),                        
                                type: self.getResourceValue(statement, ['FIle_Statement_type','@display_value'])
                            };
                        });
                    }
                    return {
                        fileName: fileName,
                        statements: statements,
                    };
                });
    
                files.forEach(function(file){
                    var fileName = file.fileName;
                    var fileInterpretation = findStatementType(file.statements, 'interpretation');
                    var fileParameter = findStatementType(file.statements, 'brief text');
                    fileList.push({
                        name: fileName,
                        interpretation: fileInterpretation,
                        parameter: fileParameter,
                    });
                });

                self.fileLists.push({
                    digitalResourceName: digitalResourceName,
                    fileList: fileList,
                });
                self.digitalResourceLoading(false);
                if (!self.resourceLoading()){
                    self.loading(false);
                }
            });
        }, this);

        this.resourceData.subscribe(function(val){
            this.displayName = val.displayname;
            this.reportVals = {
                sampledObjectName: {'name': 'Sampled Object', 'value': this.getResourceValue(val.resource['Name'][0], ['Name_content', '@display_value'])},
                objectName: {'name': 'Object Name', 'value': this.getResourceValue(val.resource, ['part of', '@display_value'])},
            };

            // var parentPhysThingResourceId = this.getResourceValue(val.resource, ['part of', 'resourceId']);
            var parentPhysThingData = ko.observable();
            self.getResourceData(val.resourceinstanceid, parentPhysThingData);
            parentPhysThingData.subscribe(function(val){
                if (val.resource["Part Identifier Assignment"].length > 0){
                    var parentPhysThings = val.resource["Part Identifier Assignment"].map(function(part){
                        return {
                            name: self.getResourceValue(part, ['Part Identifier Assignment_Physical Part of Object','@display_value']),
                            resourceid: self.getResourceValue(part, ['Part Identifier Assignment_Physical Part of Object','resourceId']),
                            annotation: self.getResourceValue(part, ['Part Identifier Assignment_Polygon Identifier','@display_value'])
                        };
                    });
                }
                parentPhysThings.forEach(function(thing){
                    // if (thing.resourceid === self.resourceid){
                        var annotationJson = JSON.parse(thing.annotation.replaceAll("'",'"'));
                        self.leafletConfig = self.prepareAnnotation(annotationJson);
                    // }
                });
                self.resourceLoading(false);
                if (!self.digitalResourceLoading()){
                    self.loading(false);
                }    
            });
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

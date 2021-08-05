define([
    'jquery',
    'underscore',
    'knockout',
    'views/components/workflows/summary-step',
], function($, _, ko, SummaryStep) {

    function viewModel(params) {
        var self = this;

        this.loading = ko.observable(true);
        this.digitalResourceLoading = ko.observable();
        this.resourceLoading = ko.observable();
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


        params.form.resourceId(params.form.externalStepData.selectobjectstep.data["sample-object-resource-instance"][0][1][0].resourceId);
        SummaryStep.apply(this, [params]);
        this.selectedDatasets = params.form.externalStepData.selecteddatasets.data["dataset-select-instance"].map(function(val) {
            return val[1][0]['resourceid'];
        });

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
                    var fileName = self.getResourceValue(file, ['File_Name', 'File_Name_content','@value']);
                    var statements = file["FIle_Statement"].map(function(statement){
                        return {
                            statement: self.getResourceValue(statement, ['FIle_Statement_content','@value']),                        
                            type: self.getResourceValue(statement, ['FIle_Statement_type','@value'])
                        };
                    });
                    return {
                        fileName: fileName,
                        statements: statements,
                    };
                });
    
                files.forEach(function(file){
                    var fileName = file.fileName;
                    var fileInterpretation = findStatementType(file.statements, 'interpretation');
                    var fileParameter = findStatementType(file.statements, 'materials/technique description');    
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
            var description = val.resource['Descriptions'] && val.resource['Descriptions'].length ? val.resource['Descriptions'][0] : {};
            this.displayName = val.displayname;
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
                });
            } catch(e) {
                this.reportVals.references = [];
            }

            this.resourceLoading(false);
            if (!this.digitalResourceLoading()){
                this.loading(false);
            }
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

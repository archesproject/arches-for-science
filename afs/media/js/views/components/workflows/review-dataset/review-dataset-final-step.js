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

        this.digitalResourceLoading = ko.observable()
        this.resourceLoading = ko.observable()

        params.form.resourceId(params.form.externalStepData.selectobjectstep.data["sample-object-resource-instance"][0][1][0].resourceId)
        SummaryStep.apply(this, [params]);
        this.selectedDatasets = params.form.externalStepData.selecteddatasets.data["dataset-select-instance"].map(function (val) {
            return val[1][0]['resourceid']
        });
        this.selectedDatasetData = ko.observableArray();
        this.fileList = ko.observableArray();

        this.getResourceData(this.selectedDatasets[0], this.selectedDatasetData);
        this.selectedDatasetData.subscribe(function(val){
            var findStatementType= function(statements, type){
                var foundStatement = _.find(statements, function(statement) {
                    return statement.type.indexOf(type) > -1;
                })
                return foundStatement ? foundStatement.statement : "None";
            }

            var files = val.resource['File'].map(function(file){
                var fileName = self.getResourceValue(file, ['File_Name', 'File_Name_content','@value']);
                var statements = file["FIle_Statement"].map(function(statement){
                    return {
                        statement: self.getResourceValue(statement, ['FIle_Statement_content','@value']),                        
                        type: self.getResourceValue(statement, ['FIle_Statement_type','@value'])
                    };
                })
                return {
                    fileName: fileName,
                    statements: statements,
                }
            })

            files.forEach(function(file){
                var fileName = file.fileName;
                var fileInterpretation = findStatementType(file.statements, 'interpretation');
                var fileParameter = findStatementType(file.statements, 'materials/technique description');    
                self.fileList.push({
                    name: fileName,
                    interpretation: fileInterpretation,
                    parameter: fileParameter,
                });
            });
            this.digitalResourceLoading(false);
            if (!this.resourceLoading()){
                this.loading(false);
            }
        }, this);

        this.resourceData.subscribe(function(val){
            var description = val.resource['Descriptions'] && val.resource['Descriptions'].length ? val.resource['Descriptions'][0] : {};
            self.displayName = val.displayname;
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

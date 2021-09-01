define([
    'knockout',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(ko, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;

        params.form.resourceId(params.samplingActivityResourceId);

        SummaryStep.apply(this, [params]);

        this.findStatementType= function(statements, type){
            var foundStatement = _.find(statements, function(statement) {
                return statement.type.indexOf(type) > -1;
            });
            return foundStatement ? foundStatement.statement : "None";
        };

        this.tableConfig = {
            "info": false,
            "paging": false,
            "scrollCollapse": true,
            "searching": false,
            "ordering": false,
            "type": "html",
            "columns": [
                null,
                null,
                null,
            ]
        };

        this.resourceData.subscribe(function(val){
            this.displayName = val.displayname;
            this.reportVals = {
                projectName: {'name': 'Project', 'value': this.getResourceValue(val.resource, ['part of','@display_value'])},
                sampledObjectName: {'name': 'Sampled Object', 'value': this.getResourceValue(val.resource['Sampling Unit'][0], ['Sampling Area','Overall Object Sampled','@display_value'])},
                samplers: {'name': 'Samplers', 'value': this.getResourceValue(val.resource, ['carried out by','@display_value'])},
                samplingDate: {'name': 'Sampling Date', 'value': this.getResourceValue(val.resource, ['TimeSpan','TimeSpan_begin of the begin','@display_value'])},
                samplingActivityName: {'name': 'Sampling Activity Name', 'value': this.getResourceValue(val.resource['Name'][0], ['Name_content','@display_value'])},
            };

            var statements = val.resource['Statement'].map(function(val){
                return {
                    statement:  self.getResourceValue(val, ['Statement_content','@display_value']),
                    type: self.getResourceValue(val, ['Statement_type','@display_value'])
                };
            });
            var samplingTechnique = self.findStatementType(statements, "description,brief text");
            var samplingMotivation = self.findStatementType(statements, "sampling motivation");
            this.reportVals.technique = {'name': 'Sampling Technique', 'value': samplingTechnique};
            this.reportVals.motivation = {'name': 'Sampling Motivation', 'value': samplingMotivation};

            var annotationCollection = {};
            val.resource["Sampling Unit"].forEach(function(unit){
                if (unit['Sample Created']['@display_value']) {
                    var locationName = self.getResourceValue(unit, ['Sample Created','@display_value']);
                    var locationResourceId = self.getResourceValue(unit, ['Sample Created','resourceId']);
                    var locationAnnotationStr = self.getResourceValue(unit, ['Sampling Area','Sampling Area Identification','Sampling Area Visualization','@display_value']);
                    var locationAnnotation = JSON.parse(locationAnnotationStr.replaceAll("'",'"'));

                    if (locationAnnotation) {
                        console.log(locationAnnotation.features)
                        var canvas = locationAnnotation.features[0].properties.canvas;
                        if (canvas in annotationCollection) {
                            annotationCollection[canvas].push({
                                locationName: locationName,
                                locationResourceId: locationResourceId,
                                locationAnnotation: locationAnnotation,
                            });
                        } else {
                            annotationCollection[canvas] = [{
                                locationName: locationName,
                                locationResourceId: locationResourceId,
                                locationAnnotation: locationAnnotation,
                            }];
                        }
                    }    
                }
            })
    
            self.sampleAnnotations = ko.observableArray();
            self.samplingLocations = ko.observableArray();
            self.annotationStatus = ko.observable()
            for (var canvas in annotationCollection) {
                var annotationCombined;
                var numberOfAnnotation = annotationCollection[canvas].length;
                var i = 0;
                annotationCollection[canvas].forEach(function(annotation){
                    var locationName = annotation.locationName;
                    var locationAnnotation = annotation.locationAnnotation;
                    var locationResourceId = annotation.locationResourceId;
    
                    if (annotationCombined) {
                        annotationCombined.features = annotationCombined.features.concat(annotation.locationAnnotation.features);
                    } else {
                        annotationCombined = annotation.locationAnnotation;
                    }
    
                    var currentLocation = ko.observable();
                    self.getResourceData(locationResourceId, currentLocation);
                    currentLocation.subscribe(function(val){
                        var samplingLocationName = val.displayname;
                        if (val.resource["Statement"]){
                            var statements = val.resource["Statement"].map(function(statement){
                                return {
                                    statement: self.getResourceValue(statement, ['Statement_content','@display_value']),                        
                                    type: self.getResourceValue(statement, ['Statement_type','@display_value'])
                                };
                            });
                            var sampleMotivation = self.findStatementType(statements, "object/work type (category)");
                            var sampleDescription = self.findStatementType(statements, "sample description");
                            self.samplingLocations.push(
                                {
                                    samplingLocationName: samplingLocationName,
                                    sampleDescription: sampleDescription.replace( /(<([^>]+)>)/ig, ''),
                                    sampleMotivation:sampleMotivation.replace( /(<([^>]+)>)/ig, ''),
                                }
                            );
                        }
                        i += 1;
                        if (i === numberOfAnnotation) {
                            self.annotationStatus.valueHasMutated();
                        }
                    });
                });
                self.annotationStatus.subscribe(function(){
                    var leafletConfig = self.prepareAnnotation(annotationCombined);
                    self.sampleAnnotations.push({
                        samplingLocations: self.samplingLocations(),
                        leafletConfig: leafletConfig,
                        featureCollection: annotationCombined,
                    });
                })
            };
            this.loading(false);
        }, this);
    }

    ko.components.register('sample-taking-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sample-taking-final-step.htm' }
    });
    return viewModel;
});

define([
    'knockout',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(ko, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;

        params.form.resourceId(params.form.externalStepData['selectobjectstep']['data']['sampling-info'][0][1]['samplingActivityResourceId']);
        this.sampleLocations = params.form.externalStepData.samplelocations.data["sample-location-instance"];
        SummaryStep.apply(this, [params]);

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

        var annotationCollection = {};
        this.sampleLocations.forEach(function(loc){
            const nameNode = '3e541cc6-859b-11ea-97eb-acde48001122';
            const annotationNode = '97c30c42-8594-11ea-97eb-acde48001122';
            const locationInstanceNode = 'b240c366-8594-11ea-97eb-acde48001122';

            var locationName = loc.data[nameNode];
            var locationAnnotation = loc.data[annotationNode];
            var locationResourceId = loc.data[locationInstanceNode][0]["resourceId"];

            if (locationAnnotation) {
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
        })
            
        console.log(annotationCollection)

        self.sampleAnnotations = ko.observableArray();
        self.samplingLocations = ko.observableArray();
        self.annotationStatus = ko.observable()
        for (var canvas in annotationCollection) {
            var annotationCombined;
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
                    var findStatementType= function(statements, type){
                        var foundStatement = _.find(statements, function(statement) {
                            return statement.type.indexOf(type) > -1;
                        });
                        return foundStatement ? foundStatement.statement : "None";
                    };
                    var samplingLocationName = val.displayname;
                    var statements = val.resource["Statement"].map(function(statement){
                        return {
                            statement: self.getResourceValue(statement, ['Statement_content','@display_value']),                        
                            type: self.getResourceValue(statement, ['Statement_type','@display_value'])
                        };
                    });
                    var sampleMotivation = findStatementType(statements, "brief text,description");
                    var sampleDescription = findStatementType(statements, "sample description");
                    self.samplingLocations.push(
                        {
                            samplingLocationName: samplingLocationName,
                            sampleDescription: sampleDescription.replace( /(<([^>]+)>)/ig, ''),
                            sampleMotivation:sampleMotivation.replace( /(<([^>]+)>)/ig, ''),
                        }
                    );
                    self.annotationStatus.valueHasMutated();
                });
            });
            self.annotationStatus.subscribe(function(){
                var leafletConfig = self.prepareAnnotation(annotationCombined);
                self.sampleAnnotations.push({
                    samplingLocations: self.samplingLocations(),
                    leafletConfig: leafletConfig,
                    featureCollection: annotationCombined,
                });
                console.log(self.sampleAnnotations())    
            })
        };

        this.resourceData.subscribe(function(val){
            this.reportVals = {
                projectName: {'name': 'Project', 'value': this.getResourceValue(val.resource, ['part of','@value'])},
                sampledObjectName: {'name': 'Sampled Object', 'value': this.getResourceValue(val.resource['Sampling Unit'][0], ['Sampling Area','Overall Object Sampled','@value'])},
                samplers: {'name': 'Samplers', 'value': this.getResourceValue(val.resource, ['carried out by','@value'])},
                samplingDate: {'name': 'Sampling Date', 'value': this.getResourceValue(val.resource, ['TimeSpan','TimeSpan_begin of the begin','@value'])},
                statement: {'name': 'Technique', 'value': this.getResourceValue(val.resource['Statement'][0], ['Statement_content','@value'])},
                samplingActivityName: {'name': 'Sampling Activity Name', 'value': this.getResourceValue(val.resource, ['Name','Name_content','@value'])},
            };

            var annotationStr = self.getResourceValue(val.resource['Sampling Unit'][0], ['Sampling Area', 'Sampling Area Identification', 'Sampling Area Visualization', '@value']);
            if (annotationStr && annotationStr !== 'none'){
                var annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                self.leafletConfig = this.prepareAnnotation(annotationJson);
            }
            else {
                self.leafletConfig = {};
            }

            try {
                this.reportVals.samplingUnits = val.resource['Sampling Unit'].map(function(val){
                    return {
                        obsName:  {'name': 'Observation Name', 'value': self.getResourceValue(val, ['Sample Created','@value'])},
                        samplingArea: {'name': 'Sampling Area', 'value': self.getResourceValue(val, ['Sampling Area','Overall Object Sampled','@value'])}
                    };
                });
            } catch(e) {
                console.log(e);
                this.reportVals.annotations = [];
            }
        
            this.loading(false);
        }, this);
    }

    ko.components.register('sample-taking-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sample-taking-final-step.htm' }
    });
    return viewModel;
});

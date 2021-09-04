define([
    'geojson-extent',
    'knockout',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(geojsonExtent, ko, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;

        this.map = ko.observable();
        this.selectedAnnotationTileId = ko.observable();
        var defaultColor;

        params.form.resourceId(params.samplingActivityResourceId);

        SummaryStep.apply(this, [params]);

        this.findStatementType= function(statements, type){
            var foundStatement = statements.find(function(statement) {
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

        this.prepareAnnotation = function(featureCollection) {
            var canvas = featureCollection.features[0].properties.canvas;

            var afterRender = function(map) {
                L.tileLayer.iiif(canvas + '/info.json').addTo(map);
                var extent = geojsonExtent(featureCollection);
                map.addLayer(L.geoJson(featureCollection, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, feature.properties);
                    },
                    style: function(feature) {
                        return feature.properties;
                    },
                    onEachFeature: function(feature, layer) {
                        layer.on('click', function() {
                            if (feature.properties && feature.properties.tileId){
                                self.highlightAnnotation(feature.properties.tileId);
                            }
                        });
                    }
                }));
                L.control.fullscreen().addTo(map);
                setTimeout(function() {
                    map.fitBounds([
                        [extent[1]-1, extent[0]-1],
                        [extent[3]+1, extent[2]+1]
                    ]);
                }, 250);
                self.map(map);
            };

            return {
                center: [0, 0],
                crs: L.CRS.Simple,
                zoom: 0,
                afterRender: afterRender
            };
        };

        this.highlightAnnotation = function(tileId){
            if (tileId !== self.selectedAnnotationTileId()){
                self.selectedAnnotationTileId(tileId);
            } else {
                self.selectedAnnotationTileId(null);
            }
            if (self.map()) {
                self.map().eachLayer(function(layer){
                    if (layer.eachLayer) {
                        layer.eachLayer(function(feature){
                            if (!defaultColor) {
                                defaultColor = feature.feature.properties.color;
                            }
                            if (self.selectedAnnotationTileId() === feature.feature.properties.tileId) {
                                feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                            } else {
                                feature.setStyle({color: defaultColor, fillColor: defaultColor});
                            }
                        });
                    }
                });
            } 
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
                    var tileId = self.getResourceValue(unit, ['Sampling Area','Sampling Area Identification','Sampling Area Visualization','@tile_id']);

                    if (locationAnnotationStr) {
                        var locationAnnotation = JSON.parse(locationAnnotationStr.replaceAll("'",'"'));
                        var canvas = locationAnnotation.features[0].properties.canvas;
                        locationAnnotation.features.forEach(function(feature){
                            feature.properties.tileId = tileId;
                        });    
                        if (canvas in annotationCollection) {
                            annotationCollection[canvas].push({
                                tileId: tileId,
                                locationName: locationName,
                                locationResourceId: locationResourceId,
                                locationAnnotation: locationAnnotation,
                            });
                        } else {
                            annotationCollection[canvas] = [{
                                tileId: tileId,
                                locationName: locationName,
                                locationResourceId: locationResourceId,
                                locationAnnotation: locationAnnotation,
                            }];
                        }
                    }    
                }
            });
    
            self.sampleAnnotations = ko.observableArray();
            self.samplingLocations = ko.observableArray();
            self.annotationStatus = ko.observable();
            for (var canvas in annotationCollection) {
                var annotationCombined;
                var numberOfAnnotation = annotationCollection[canvas].length;
                var i = 0;
                annotationCollection[canvas].forEach(function(annotation){
                    var locationResourceId = annotation.locationResourceId;
                    var locationTileId = annotation.tileId;
    
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
                            var sampleMotivation = self.findStatementType(statements, "object/work type (category)").replace( /(<([^>]+)>)/ig, '');
                            var sampleDescription = self.findStatementType(statements, "sample description").replace( /(<([^>]+)>)/ig, '');
                        }
                        self.samplingLocations.push(
                            {
                                tileId: locationTileId,
                                samplingLocationName: samplingLocationName || "None",
                                sampleDescription: sampleDescription || "None",
                                sampleMotivation: sampleMotivation || "None",
                            }
                        );
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
                });
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

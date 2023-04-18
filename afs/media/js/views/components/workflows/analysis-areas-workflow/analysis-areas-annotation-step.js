define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'geojson-extent',
    'leaflet',
    'views/components/workflows/stepUtils',
    'utils/resource',
    'models/graph',
    'viewmodels/card',
    'viewmodels/tile',
    'views/components/iiif-annotation',
    'templates/views/components/iiif-popup.htm',
    'templates/views/components/workflows/analysis-areas-workflow/analysis-areas-annotation-step.htm',
    'views/components/resource-instance-nodevalue',
], function(_, $, arches, ko, koMapping, geojsonExtent, L, StepUtils, ResourceUtils, GraphModel, CardViewModel, TileViewModel, IIIFAnnotationViewmodel, iiifPopup, analysisAreasAnnotationStepTemplate) {
    function viewModel(params) {
        var self = this;
        _.extend(this, params);

        this.getStrValue = strObject => {
            let strValue;
            if (typeof strObject == 'object') {
                strValue = ko.toJS(strObject)[arches.activeLanguage]['value'];
            } else {
                strValue = ko.unwrap(strObject)[arches.activeLanguage]['value'];
            }
            return strValue;
        };

        this.physicalThingResourceId = koMapping.toJS(params.physicalThingResourceId);
        
        var digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
        const partIdentifierAssignmentPhysicalPartOfObjectNodeId = 'b240c366-8594-11ea-97eb-acde48001122'; 
        const physicalThingPartAnnotationNodeId = "97c30c42-8594-11ea-97eb-acde48001122";
        this.allFeatureIds = [];
        this.sampleLocationResourceIds = [];
        this.manifestUrl = ko.observable(this.getStrValue(params.imageStepData[digitalResourceServiceIdentifierContentNodeId]));

        this.savingTile = ko.observable();
        this.savingMessage = ko.observable();
        this.physThingSearchResultsLookup = {};

        this.selectedFeature = ko.observable();
        this.featureLayers = ko.observableArray();
        this.isFeatureBeingEdited = ko.observable(false);
        this.sampleListShowing = ko.observable(false);

        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();

        this.partIdentifierAssignmentLabelWidget = ko.observable();
        this.partIdentifierAssignmentPolygonIdentifierWidget = ko.observable();
        this.partIdentifierAssignmentAnnotatorWidget = ko.observable();

        this.activeTab = ko.observable();
        this.hasExternalCardData = ko.observable(false);

        this.analysisAreaInstances = ko.observableArray();
        
        this.selectedAnalysisAreaInstance = ko.observable();

        this.switchCanvas = function(tile){
            const features = ko.unwrap(tile.data[physicalThingPartAnnotationNodeId].features);
            const canvasPath = features?.[0]?.properties.canvas();
            if (self.canvas() !== canvasPath) {
                var canvas = self.canvases().find(c => c.images[0].resource.service['@id'] === canvasPath);
                if (canvas) {
                    self.canvasClick(canvas);       
                }
            }
        };

        this.selectedAnalysisAreaInstance.subscribe(function(selectedAnalysisAreaInstance) {
            self.highlightAnnotation();

            if (selectedAnalysisAreaInstance) {
                self.tile = selectedAnalysisAreaInstance;
                params.tile = selectedAnalysisAreaInstance;
                self.physicalThingPartIdentifierAssignmentTile(selectedAnalysisAreaInstance);
                if (ko.unwrap(selectedAnalysisAreaInstance.data[physicalThingPartAnnotationNodeId])?.features) {
                    self.switchCanvas(selectedAnalysisAreaInstance);
                }
            }else{
                self.sampleListShowing(!!self.analysisAreaInstances().length);
            }
        });

        this.tileDirty = ko.computed(function() {
            if (self.physicalThingPartIdentifierAssignmentTile()) {
                return self.physicalThingPartIdentifierAssignmentTile().dirty();
            }
        });
                
        this.selectedAnalysisAreaInstanceFeatures = ko.computed(function() {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            if (self.selectedAnalysisAreaInstance()) {
                if (ko.unwrap(self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId])) {
                    var partIdentifierAssignmentPolygonIdentifierData = ko.unwrap(self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId]);
                    return ko.unwrap(partIdentifierAssignmentPolygonIdentifierData.features);
                }
            }
        });

        this.analysisAreaFilterTerm = ko.observable();
        this.filteredAnalysisAreaInstances = ko.computed(function() {
            const analysisAreasOnly = self.analysisAreaInstances().filter(function(a){
                const sampleLocationResourceIds = self.sampleLocationResourceIds.map(item => item.resourceid);
                const partId = ko.unwrap(a.data[partIdentifierAssignmentPhysicalPartOfObjectNodeId]()[0].resourceId);
                return !sampleLocationResourceIds.includes(partId);
            });
            self.analysisAreasOnlySnapshot = analysisAreasOnly.map(tile => tile.tileid);
            if (self.analysisAreaFilterTerm()) {
                return analysisAreasOnly.filter(function(analysisAreaInstance) {
                    var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
                    return analysisAreaInstance.data[partIdentifierAssignmentLabelNodeId]().includes(self.analysisAreaFilterTerm());
                });
            }
            else {
                return analysisAreasOnly;
            }
        });

        this.hasExternalCardData.subscribe(function(hasExternalCardData) {
            if (hasExternalCardData) {
                self.handleExternalCardData();

                var physicalThingGeometriestAnnotationSubscription = self.annotationNodes.subscribe(function(annotationNodes) {
                    self.setPhysicalThingGeometriesToVisible(annotationNodes);
                    physicalThingGeometriestAnnotationSubscription.dispose(); /* self-disposing subscription only runs once */
                });

                self.activeTab('dataset');

                self.manifest(self.manifestUrl());
                self.getManifestData();
            }
        });

        this.physicalThingName = ko.observable();
        window.fetch(arches.urls.api_resources(self.physicalThingResourceId) + '?format=json&compact=false&v=beta')
            .then(function(response){
                if(response.ok){
                    return response.json();
                }
            })
            .then(function(data){
                self.physicalThingName(data.displayname);
            });

        this.areaName = ko.computed(function(){
            var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
            if (self.selectedAnalysisAreaInstance()){
                const nameValue = self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentLabelNodeId];
                const baseName = self.getStrValue(nameValue) || "";
                return `${baseName} [Region of ${self.physicalThingName()}]`;
            }
        });

        this.initialize = function() {
            let subscription = self.analysisAreaInstances.subscribe(function(){
                if (self.analysisAreaInstances().length > 0) {
                    self.sampleListShowing(true);
                }
                subscription.dispose();
            });
            $.getJSON(arches.urls.api_card + self.physicalThingResourceId).then(function(data) {
                self.loadExternalCardData(data);
            });
        };

        self.analysisAreaInstances.subscribe(function(instances){
            if(instances.length > 0){
                params.form.complete(true);
            }else{
                params.form.complete(false);
            }
        });

        this.getAnalysisAreaTileFromFeatureId = function(featureId) {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            return self.analysisAreaInstances().find(function(analysisAreaInstance) {
                var analysisAreaInstanceFeatures = analysisAreaInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId].features();

                return analysisAreaInstanceFeatures.find(function(analysisAreaInstanceFeature) {
                    return ko.unwrap(analysisAreaInstanceFeature.id) === featureId;
                });
            });
        };

        this.getAnnotationProperty = function(tile, property){
            return tile.data[self.annotationNodeId].features[0].properties[property];
        };

        this.highlightAnnotation = function(){
            if (self.map()) {
                self.map().eachLayer(function(layer){
                    if (layer.eachLayer) {
                        layer.eachLayer(function(features){
                            if (features.eachLayer) {
                                features.eachLayer(function(feature) {
                                    var defaultColor = feature.feature.properties.color;

                                    if (self.selectedAnalysisAreaInstance() && self.selectedAnalysisAreaInstance().tileid === feature.feature.properties.tileId) {
                                        feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                                        if (feature.feature.geometry.type === 'Point') {
                                            var coords = feature.feature.geometry.coordinates;
                                            self.map().panTo([coords[1], coords[0]]);
                                        } else {
                                            var extent = geojsonExtent(feature.feature);
                                            self.map().fitBounds([
                                                [extent[1], extent[0]],
                                                [extent[3], extent[2]]
                                            ]);
                                        }
                                    } else {
                                        feature.setStyle({color: defaultColor, fillColor: defaultColor});
                                    }
                                });
                            }
                        });
                    }
                });
            } 
        };

        this.removeFeatureFromCanvas = function(feature) {
            var annotationNodes = self.annotationNodes();
            
            var physicalThingAnnotationNodeName = "Analysis Areas";
            var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                return annotationNode.name === physicalThingAnnotationNodeName;
            });

            var filteredPhysicalThingAnnotationNodeAnnotations = physicalThingAnnotationNode.annotations().filter(function(annotation) {
                return ko.unwrap(feature.id) !== annotation.id;
            });

            physicalThingAnnotationNode.annotations(filteredPhysicalThingAnnotationNodeAnnotations);

            var physicalThingAnnotationNodeIndex = annotationNodes.findIndex(function(annotationNode) {
                return annotationNode.name === physicalThingAnnotationNodeName;
            });

            annotationNodes[physicalThingAnnotationNodeIndex] = physicalThingAnnotationNode;

            self.annotationNodes(annotationNodes);

            self.highlightAnnotation();
        };

        this.resetCanvasFeatures = function() {
            var annotationNodes = self.annotationNodes();
            
            if (self.selectedAnalysisAreaInstanceFeatures()) {
                var physicalThingAnnotationNodeName = "Analysis Areas";
                var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                    return annotationNode.name === physicalThingAnnotationNodeName;
                });
    
                var physicalThingAnnotationNodeAnnotationIds = physicalThingAnnotationNode.annotations().map(function(annotation) {
                    return ko.unwrap(annotation.id);
                });
                
                var unaddedSelectedAnalysisAreaInstanceFeatures = self.selectedAnalysisAreaInstanceFeatures().reduce(function(acc, feature) {
                    if (!physicalThingAnnotationNodeAnnotationIds.includes(ko.unwrap(feature.id)) &&
                        feature.properties.canvas === self.canvas) {
                        feature.properties.tileId = self.selectedAnalysisAreaInstance().tileid;
                        acc.push(ko.toJS(feature));
                    }
                    return acc;
                }, []);
    
                physicalThingAnnotationNode.annotations([...physicalThingAnnotationNode.annotations(), ...unaddedSelectedAnalysisAreaInstanceFeatures]);
    
                var physicalThingAnnotationNodeIndex = annotationNodes.findIndex(function(annotationNode) {
                    return annotationNode.name === physicalThingAnnotationNodeName;
                });
    
                annotationNodes[physicalThingAnnotationNodeIndex] = physicalThingAnnotationNode;
            }

            self.annotationNodes(annotationNodes);
        };

        this.updateAnalysisAreaInstances = function() {
            const canvasids = self.canvases().map(canvas => canvas.images[0].resource['@id']);

            const tileids = self.card.tiles().map(tile => tile.tileid);
            if (self.selectedAnalysisAreaInstance() && self.selectedAnalysisAreaInstance().tileid){
                if (!tileids.includes(self.selectedAnalysisAreaInstance().tileid)) {
                    self.card.tiles.push(self.selectedAnalysisAreaInstance());
                } else {
                    self.card.tiles().forEach(function(tile){
                        if (tile.tileid === self.selectedAnalysisAreaInstance().tileid) {
                            Object.keys(tile.data).map(key => {
                                if (ko.isObservable(tile.data[key])) {
                                    tile.data[key](self.selectedAnalysisAreaInstance().data[key]());
                                } else if (key !== '__ko_mapping__') {
                                    Object.keys(tile.data[key]).map(childkey => {
                                        if (ko.isObservable(tile.data[key][childkey])){
                                            tile.data[key][childkey](self.selectedAnalysisAreaInstance().data[key][childkey]());
                                        } else {
                                            tile.data[key][childkey]['value'](self.selectedAnalysisAreaInstance().data[key][childkey]['value']());
                                            tile.data[key][childkey]['direction'](self.selectedAnalysisAreaInstance().data[key][childkey]['direction']());
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
            const tilesBelongingToManifest = self.card.tiles().filter(
                tile => canvasids.find(
                    canvas => canvas.startsWith(tile.data[physicalThingPartAnnotationNodeId].features()[0].properties.canvas())
                )
            );
            // get locked status
            tilesBelongingToManifest.forEach(function(analysisAreaTile){
                analysisAreaTile.isLocked = ko.observable();
                const physicalPartObjectNodeId = "b240c366-8594-11ea-97eb-acde48001122";
                let analysisAreaResourceId = null;
                
                if(analysisAreaTile.data[physicalPartObjectNodeId]()){
                    analysisAreaResourceId = analysisAreaTile.data[physicalPartObjectNodeId]()[0]["resourceId"]();
                }
                window.fetch(arches.urls.root + 'analysisarealocked' + '?resourceId=' + analysisAreaResourceId)
                    .then(function(response) {
                        if(response.ok){
                            return response.json();
                        }
                    })
                    .then(function(data){
                        analysisAreaTile.isLocked(data.isRelatedToDigitalResource);
                    });
            });
            self.analysisAreaInstances(tilesBelongingToManifest);
        };

        this.selectAnalysisAreaInstance = function(analysisAreaInstance) {
            var previouslySelectedAnalysisAreaInstance = self.selectedAnalysisAreaInstance();
            
            if (analysisAreaInstance === undefined || (previouslySelectedAnalysisAreaInstance && previouslySelectedAnalysisAreaInstance.tileid !== analysisAreaInstance.tileid)) {
                /* resets any changes not explicity saved to the tile */ 
                previouslySelectedAnalysisAreaInstance.reset();

                self.drawFeatures([]);
                self.resetCanvasFeatures();
            }

            if (self.physicalThingPartIdentifierAssignmentTile()) {
                self.physicalThingPartIdentifierAssignmentTile().reset();
            }
            
            self.selectedAnalysisAreaInstance(analysisAreaInstance);

        };

        this.viewAnalysisAreaInstance = function(analysisAreaInstance){
            self.selectAnalysisAreaInstance(analysisAreaInstance);
            self.sampleListShowing(false);
        };

        this.showSampleList = function() {
            self.sampleListShowing(!self.sampleListShowing());
        };

        this.resetAnalysisAreasTile = function() {
            self.tile.reset();
            self.resetCanvasFeatures();
            self.drawFeatures([]);
            self.highlightAnnotation();
            self.selectedFeature(null);
        };

        this.setPhysicalThingGeometriesToVisible = function(annotationNodes) {
            var physicalThingAnnotationNodeName = "Analysis Areas";
            var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                return annotationNode.name === physicalThingAnnotationNodeName;
            });

            physicalThingAnnotationNode.active(true); 
            self.updateAnalysisAreaInstances();
        };

        this.showingAnalysisAreaDeleteModal = ko.observable(false);
        this.sampleToDelete = ko.observable();

        this.showAnalysisAreaDeleteModal = function(sample){
            self.showingAnalysisAreaDeleteModal(!!sample);
            self.sampleToDelete(sample);
        };

        this.deleteAnalysisAreaInstance = function(){
            let parentPhysicalThing = self.sampleToDelete();
            self.selectedAnalysisAreaInstance(parentPhysicalThing);
            const data = {
                parentPhysicalThingResourceId: parentPhysicalThing.resourceinstance_id,
                collectionResourceid: params.projectSet,
                parentPhysicalThingTileData: koMapping.toJSON(parentPhysicalThing.data),
                parentPhysicalThingTileId: parentPhysicalThing.tileid,
                transactionId: params.form.workflowId,
                analysisAreaName: self.areaName()
            };

            self.savingTile(true);
            self.showingAnalysisAreaDeleteModal(false);
            self.savingMessage("Deleting Analysis Area");

            window.fetch(arches.urls.root + 'deleteanalysisarea', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(function(response){
                self.savingTile(false);
                if(response.ok){
                    return;
                }
                
                throw response;
            }).then(function(data){
                parentPhysicalThing.data[physicalThingPartAnnotationNodeId].features().forEach(function(feature){
                    self.deleteFeature(feature);
                });
                self.analysisAreaInstances.remove(parentPhysicalThing);
                self.card.tiles.remove(parentPhysicalThing);
                self.selectAnalysisAreaInstance(undefined);
                self.resetAnalysisAreasTile();
            }).catch((response) => {
                response.json().then(function(error){
                    params.pageVm.alert(new params.form.AlertViewModel(
                        "ep-alert-red",
                        error.title,
                        error.message,
                    )); 
                });
            });
        };

        this.saveAnalysisAreaTile = function() {
            const annotationLabelNodeid = "3e541cc6-859b-11ea-97eb-acde48001122";
            const annotationPolygonIdentifierNodeid = "97c30c42-8594-11ea-97eb-acde48001122";
            
            if (!ko.unwrap(self.selectedAnalysisAreaInstance().data[annotationLabelNodeid])) {
                params.pageVm.alert(new params.form.AlertViewModel('ep-alert-red', "Name required", "Providing a name is required"));
                return;
            }
            if (!ko.unwrap(self.selectedAnalysisAreaInstance().data[annotationPolygonIdentifierNodeid])) {
                params.pageVm.alert(new params.form.AlertViewModel('ep-alert-red', "Geometry required", "Providing a geometric annotation is required"));
                return;
            }

            var updateAnnotations = function() {
                return new Promise(function(resolve, _reject) {
                    /* updates selected annotations */ 
                    var physicalThingAnnotationNodeName = "Analysis Areas";
                    var physicalThingAnnotationNode = self.annotationNodes().find(function(annotationNode) {
                        return annotationNode.name === physicalThingAnnotationNodeName;
                    });
    
                    var physicalThingAnnotations = physicalThingAnnotationNode.annotations();
    
                    self.drawFeatures().forEach(function(drawFeature) {
                        var annotationFeature = physicalThingAnnotations.find(function(annotation) {
                            return annotation.id === drawFeature;
                        });
    
                        drawFeature.properties.nodegroupId = self.tile.nodegroup_id;
                        drawFeature.properties.resourceId = self.tile.resourceinstance_id;
                        drawFeature.properties.tileId = self.tile.tileid;
    
                        if (!annotationFeature) {
                            physicalThingAnnotations.push(drawFeature);
                        }
                    });
    
                    physicalThingAnnotationNode.annotations(physicalThingAnnotations);

                    resolve(physicalThingAnnotationNode);
                });
            };

            self.savingTile(true);
            params.form.lockExternalStep('image-step', true);

            self.savingMessage(`This step is saving ...`);
            const savingMessages = [
                `Analysis Area Name and Classification`,
                `Relationship between Analysis Area, Project and Parent Object (${self.physicalThingName()})`,
                `This may take a while, please do not move away from this step.`
            ];
            let i = 0;
            const showMessage = setInterval(() => {
                if (i < savingMessages.length) {
                    self.savingMessage(savingMessages[i++]);
                } else {
                    clearInterval(showMessage);
                }}, '2000'
            );

            const showExtraMessage = setTimeout(() => {
                self.savingMessage(`This is taking longer than usual. Thank you for your patience.`);
            }, "10000");

            const data = {
                parentPhysicalThingResourceid: self.physicalThingResourceId,
                collectionResourceid: params.projectSet,
                partIdentifierAssignmentTileData: koMapping.toJSON(self.selectedAnalysisAreaInstance().data),
                partIdentifierAssignmentTileId: self.selectedAnalysisAreaInstance().tileid,
                partIdentifierAssignmentResourceId: self.selectedAnalysisAreaInstance().resourceinstance_id,
                transactionId: params.form.workflowId,
                analysisAreaName: self.areaName(),
            };

            $.ajax({
                url: arches.urls.root + 'saveanalysisarea',
                type: 'POST',
                data: data,
                dataType: 'json',
            }).then(function(data){
                self.savingMessage("Saved.");
                clearInterval(showMessage);
                clearTimeout(showExtraMessage);

                const tile = data.result.physicalPartOfObjectTile;
                tile.noDefaults = true;

                self.builtTile = new TileViewModel({
                    tile: tile,
                    card: self.card,
                    graphModel: self.card.params.graphModel,
                    resourceId: tile.resourceinstance_id,
                    displayname: self.card.params.displayname,
                    handlers: self.card.params.handlers,
                    userisreviewer: self.card.params.userisreviewer,
                    cards: self.card.params.cards,
                    tiles: self.card.params.tiles,
                    selection: self.card.params.selection,
                    scrollTo: self.card.params.scrollTo,
                    filter: self.card.params.filter,
                    provisionalTileViewModel: self.card.params.provisionalTileViewModel,
                    loading: self.card.params.loading,
                    cardwidgets: self.card.params.cardwidgets,
                });

                self.selectedAnalysisAreaInstance(self.builtTile);

                updateAnnotations().then(function(_physicalThingAnnotationNode) {
                    self.updateAnalysisAreaInstances();
                    self.sampleListShowing(true);
                    self.savingTile(false);
                    params.pageVm.alert("");
                    self.savingMessage("");
                    self.drawFeatures([]);
                    let mappedInstances = self.analysisAreaInstances().map((instance) => { return { "data": instance.data };});
                    params.form.savedData({
                        data: koMapping.toJS(mappedInstances),
                        currentAnalysisAreas: self.analysisAreasOnlySnapshot,
                    });
                    params.form.value(params.form.savedData());
                });
            }).fail(function(error){
                console.log(error);
                self.savingTile(false);
            });
        };

        const getNewTile = function(card) {
            return new TileViewModel({
                tile: {
                    tileid: '',
                    noDefaults: true,
                    resourceinstance_id: ko.observable(self.physicalThingResourceId),
                    nodegroup_id: card.nodegroupid,
                    data: _.reduce(card.widgets(), function(data, widget) {
                        if (widget.datatype.datatype === 'string') {
                            data[widget.node_id()] = {[arches.activeLanguage]: {
                                "value": "",
                                "direction": arches.activeLanguageDir
                            }};               
                        } else {
                            data[widget.node_id()] = null;
                        }
                        return data;
                    }, {})
                },
                card: card,
                graphModel: card.params.graphModel,
                resourceId: card.resourceinstance_id,
                displayname: card.params.displayname,
                handlers: card.params.handlers,
                userisreviewer: card.params.userisreviewer,
                cards: card.params.cards,
                tiles: card.params.tiles,
                selection: card.params.selection,
                scrollTo: card.params.scrollTo,
                filter: card.params.filter,
                provisionalTileViewModel: card.params.provisionalTileViewModel,
                loading: card.params.loading,
                cardwidgets: card.params.cardwidgets,
            }); 
        };

        this.loadNewAnalysisAreaTile = function() {
            var newTile = getNewTile(self.card);  /* true flag forces new tile generation */
            self.viewAnalysisAreaInstance(newTile);
        };

        this.identifySampleLocations = function(card) {
            const classificationNodeId = '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a';
            const sampleAreaTypeConceptId = '7375a6fb-0bfb-4bcf-81a3-6180cdd26123';
            const related = card.tiles().map((tile) => {
                return {
                    'resourceid': ko.unwrap(tile.data[partIdentifierAssignmentPhysicalPartOfObjectNodeId])[0].resourceId(),
                    'tileid': tile.tileid
                };
            });
            return Promise.all(related.map(resource => ResourceUtils.lookupResourceInstanceData(resource.resourceid))).then((values) => {
                values.forEach((value) => {
                    const nodevals = ResourceUtils.getNodeValues({
                        nodeId: classificationNodeId,
                        where: {
                            nodeId: classificationNodeId,
                            contains: sampleAreaTypeConceptId
                        }
                    }, value._source.tiles);
                    if (nodevals.includes(sampleAreaTypeConceptId)) {
                        self.sampleLocationResourceIds.push(related.find(tile => value._id === tile.resourceid));
                    }
                });
            });
        };

        this.loadExternalCardData = async function(data) {
            var partIdentifierAssignmentNodeGroupId = 'fec59582-8593-11ea-97eb-acde48001122';  // Part Identifier Assignment (E13) 

            var partIdentifierAssignmentCardData = data.cards.find(function(card) {
                return card.nodegroup_id === partIdentifierAssignmentNodeGroupId;
            });

            var handlers = {
                'after-update': [],
                'tile-reset': []
            };

            var graphModel = new GraphModel({
                data: {
                    nodes: data.nodes,
                    nodegroups: data.nodegroups,
                    edges: []
                },
                datatypes: data.datatypes
            });

            var partIdentifierAssignmentCard = new CardViewModel({
                card: partIdentifierAssignmentCardData,
                graphModel: graphModel,
                tile: null,
                resourceId: ko.observable(self.physicalThingResourceId),
                displayname: ko.observable(data.displayname),
                handlers: handlers,
                cards: data.cards,
                tiles: data.tiles,
                cardwidgets: data.cardwidgets,
                userisreviewer: data.userisreviewer,
            });

            var card = partIdentifierAssignmentCard;
            var tile = getNewTile(partIdentifierAssignmentCard);

            self.card = card;
            self.tile = tile;

            params.card = self.card;
            params.tile = self.tile;

            await this.identifySampleLocations(params.card);
            this.sampleLocationTileIds = self.sampleLocationResourceIds.map(item => item.tileid);

            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)
            params.widgets = self.card.widgets().filter(function(widget) {
                return widget.node_id() === partIdentifierAssignmentPolygonIdentifierNodeId;
            });

            self.physicalThingPartIdentifierAssignmentCard(card);
            self.physicalThingPartIdentifierAssignmentTile(tile);

            /* 
                subscription to features lives here because we _only_ want it to run once, on blank starting tile, when a user places a feature on the map
            */
            var tileFeatureGeometrySubscription = tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].subscribe(function(data) {
                if (data) {
                    self.selectAnalysisAreaInstance(tile);
                    tileFeatureGeometrySubscription.dispose();
                }
            });

            self.hasExternalCardData(true);
        };

        this.handleExternalCardData = function() {
            var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentLabelWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentLabelNodeId;
            }));

            var partIdentifierAssignmentPolygonIdentifierNodeId = '97c30c42-8594-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentPolygonIdentifierWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentPolygonIdentifierNodeId;
            }));                
            
            var partIdentifierAssignmentAnnotatorNodeId = 'a623eaf4-8599-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentAnnotatorWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentAnnotatorNodeId;
            }));

            IIIFAnnotationViewmodel.apply(self, [{
                ...params,
                hideEditorTab: ko.observable(true),
                onEachFeature: function(feature, layer) {
                    var featureLayer = self.featureLayers().find(function(featureLayer) {
                        return featureLayer.feature.id === layer.feature.id;
                    });

                    if (!featureLayer) {
                        self.featureLayers.push(layer);
                    }

                    if (self.sampleLocationTileIds.includes(feature.properties.tileId)){
                        const sampleLocation = self.sampleLocationResourceIds.find(sampleLocation => sampleLocation.tileid === feature.properties.tileId);
                        var popup = L.popup({
                            closeButton: false,
                            maxWidth: 349
                        })
                            .setContent(iiifPopup)
                            .on('add', function() {
                                var popupData = {
                                    'closePopup': function() {
                                        popup.remove();
                                    },
                                    'name': ko.observable(''),
                                    'description': ko.observable(''),
                                    'graphName': feature.properties.graphName,
                                    'resourceinstanceid': sampleLocation.resourceid,
                                    'reportURL': arches.urls.resource_report,
                                    'translations': arches.translations,
                                };
                                window.fetch(arches.urls.resource_descriptors + popupData.resourceinstanceid)
                                    .then(function(response) {
                                        return response.json();
                                    })
                                    .then(function(descriptors) {
                                        popupData.name(descriptors.displayname);
                                        const description = `<strong>Sample Location</strong>
                                            <br>Sample locations may not be modified in the analysis area workflow
                                            <br>${descriptors['map_popup'] !== "Undefined" ? descriptors['map_popup'] : ''}`;
                                        popupData.description(description);
                                    });
                                var popupElement = popup.getElement()
                                    .querySelector('.mapboxgl-popup-content');
                                ko.applyBindingsToDescendants(popupData, popupElement);
                            });
                        layer.bindPopup(popup);
                    }

                    layer.on({
                        click: function(e) {
                            var analysisAreaInstance = self.getAnalysisAreaTileFromFeatureId(feature.id);
                            if (analysisAreaInstance && !self.sampleLocationTileIds.includes(analysisAreaInstance.tileid)) {
                                self.featureClick = true;
                                self.drawFeatures([]);
                                if (!self.selectedAnalysisAreaInstance() || self.selectedAnalysisAreaInstance().tileid !== analysisAreaInstance.tileid) {
                                    self.selectAnalysisAreaInstance(analysisAreaInstance);
                                }
                                else {
                                    self.tile.reset();
                                    self.resetCanvasFeatures();
    
                                    var selectedFeature = ko.toJS(self.selectedAnalysisAreaInstanceFeatures().find(function(selectedAnalysisAreaInstanceFeature) {
                                        return ko.unwrap(selectedAnalysisAreaInstanceFeature.id) === feature.id;
                                    }));
    
                                    self.selectedFeature(selectedFeature);
                                    self.removeFeatureFromCanvas(self.selectedFeature());
    
                                    self.drawFeatures([selectedFeature]);
                                } 
                            }
                        },
                    });
                },
                buildAnnotationNodes: function(json) {
                    const editNodeActiveState = ko.observable(true);
                    const nonEditNodeActiveState = ko.observable(true);
                    editNodeActiveState.subscribe(function(active){
                        if (!active) {
                            self.resetAnalysisAreasTile();
                            updateAnnotations();
                        }
                    });
                    var updateAnnotations = function() {
                        let sampleAnnotations = ko.observableArray();
                        let analysisAreaAnnotations = ko.observableArray();
                        var canvas = self.canvas();
                        if (canvas) {
                            window.fetch(arches.urls.iiifannotations + '?canvas=' + canvas + '&nodeid=' + partIdentifierAssignmentPolygonIdentifierNodeId)
                                .then(function(response) {
                                    return response.json();
                                })
                                .then(function(json) {
                                    json.features.forEach(function(feature) {
                                        feature.properties.graphName = "Physical Thing";
                                        if (self.sampleLocationTileIds.includes(feature.properties.tileId)) {
                                            feature.properties.type = 'sample_location';
                                            feature.properties.color = '#999999';
                                            feature.properties.fillColor = '#999999';
                                            sampleAnnotations.push(feature);
                                        } else {
                                            feature.properties.type = 'analysis_area';
                                            analysisAreaAnnotations.push(feature);
                                        }
                                    });
                                    self.annotationNodes([
                                        {
                                            name: "Analysis Areas",
                                            icon: "fa fa-eye",
                                            active: editNodeActiveState,
                                            opacity: ko.observable(100),
                                            annotations: analysisAreaAnnotations
                                        },
                                        {
                                            name: "Sample Locations",
                                            icon: "fa fa-eyedropper",
                                            active: nonEditNodeActiveState,
                                            opacity: ko.observable(100),
                                            annotations: sampleAnnotations
                                        }
                                    ]);
                                    self.highlightAnnotation();
                                });
                        }
                    };
                    self.canvas.subscribe(updateAnnotations);
                    updateAnnotations();
                }
            }]);

            /* overwrites iiif-annotation methods */ 
            self.updateTiles = function() {
                _.each(self.featureLookup, function(value) {
                    value.selectedTool(null);
                });

                var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

                var tileFeatures = ko.toJS(self.tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].features);

                if (tileFeatures) {
                    var featuresNotInTile = self.drawFeatures().filter(function(drawFeature) {
                        return !tileFeatures.find(function(tileFeature) {
                            return tileFeature.id === drawFeature.id;
                        });
                    });

                    self.drawFeatures().forEach(function(drawFeature) {
                        var editedFeatureIndex = tileFeatures.findIndex(function(feature) {
                            return feature.id === drawFeature.id;
                        });

                        if (editedFeatureIndex > -1) {
                            tileFeatures[editedFeatureIndex] = drawFeature;
                        }
                    });

                    self.tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].features([...tileFeatures, ...featuresNotInTile]);
                }
                else {
                    self.widgets.forEach(function(widget) {
                        var id = ko.unwrap(widget.node_id);
                        var features = [];
                        self.drawFeatures().forEach(function(feature){
                            if (feature.properties.nodeId === id) {
                                features.push(feature);
                            }
                        });
                        if (ko.isObservable(self.tile.data[id])) {
                            self.tile.data[id]({
                                type: 'FeatureCollection',
                                features: features
                            });
                        } 
                        else {
                            self.tile.data[id].features(features);
                        }
                    });
                }
            };
            
            self.deleteFeature = function(feature) {
                /* BEGIN update table */ 
                var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

                var selectedAnalysisAreaInstance = self.selectedAnalysisAreaInstance();
                var selectedAnalysisAreaInstanceFeaturesNode = ko.unwrap(selectedAnalysisAreaInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId]);

                if (selectedAnalysisAreaInstanceFeaturesNode) {
                    var updatedSelectedAnalysisAreaInstanceFeatures = ko.unwrap(selectedAnalysisAreaInstanceFeaturesNode.features).filter(function(selectedFeature) {
                        return ko.unwrap(selectedFeature.id) !== ko.unwrap(feature.id);
                    });
                    
                    if (ko.isObservable(selectedAnalysisAreaInstanceFeaturesNode.features)) {
                        selectedAnalysisAreaInstanceFeaturesNode.features(updatedSelectedAnalysisAreaInstanceFeatures);
                    }
                    else {
                        selectedAnalysisAreaInstanceFeaturesNode.features = ko.observableArray(updatedSelectedAnalysisAreaInstanceFeatures);
                    }

                    selectedAnalysisAreaInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId] = selectedAnalysisAreaInstanceFeaturesNode;
                }

                self.selectedAnalysisAreaInstance(selectedAnalysisAreaInstance);
                /* END update table */ 

                /* BEGIN update canvas */ 
                self.removeFeatureFromCanvas(feature);

                var drawFeature = self.drawFeatures().find(function(drawFeature) {
                    return ko.unwrap(drawFeature.id) === ko.unwrap(feature.id);
                });

                if (drawFeature) {
                    self.drawFeatures([]);
                }
                /* END update canvas */ 
            };

            self.editFeature = function(feature) {
                self.featureLayers().forEach(function(featureLayer) {
                    if (featureLayer.feature.id === ko.unwrap(feature.id)) {
                        featureLayer.fireEvent('click');
                    }
                });
            };

            self.drawLayer.subscribe(function(drawLayer) {
                drawLayer.getLayers().forEach(function(layer) {
                    layer.editing.enable();
                    layer.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                });
            });
        };

        this.clearEditedGeometries = function() {
            if (self.tile.tileid && self.selectedFeature()) {
                self.resetAnalysisAreasTile();
            }
        };

        this.fetchCardFromResourceId = function(resourceId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                self._fetchCard(resourceId, null, nodegroupId).then(function(data) {
                    resolve(data);
                });
            });
        };

        this.fetchCardFromGraphId = function(graphId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                self._fetchCard(null, graphId, nodegroupId).then(function(data) {
                    resolve(data);
                });
            });
        };

        this._fetchCard = function(resourceId, graphId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                $.getJSON( arches.urls.api_card + ( resourceId || graphId ) ).then(function(data) {
                    var cardData = data.cards.find(function(card) {
                        return card.nodegroup_id === nodegroupId;
                    });

                    var handlers = {
                        'after-update': [],
                        'tile-reset': []
                    };
        
                    var graphModel = new GraphModel({
                        data: {
                            nodes: data.nodes,
                            nodegroups: data.nodegroups,
                            edges: []
                        },
                        datatypes: data.datatypes
                    });

                    resolve(new CardViewModel({
                        card: cardData,
                        graphModel: graphModel,
                        tile: null,
                        resourceId: ko.observable(ko.unwrap(resourceId)),
                        displayname: ko.observable(data.displayname),
                        handlers: handlers,
                        cards: data.cards,
                        tiles: data.tiles,
                        cardwidgets: data.cardwidgets,
                        userisreviewer: data.userisreviewer,
                    }));

                });
            });
        };

        ko.bindingHandlers.scrollTo = {
            update: function(element, valueAccessor) {
                var _value = valueAccessor();
                var _valueUnwrapped = ko.unwrap(_value);
                if (_valueUnwrapped) {
                    element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
                }
            }
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: analysisAreasAnnotationStepTemplate
    });
    return viewModel;
});
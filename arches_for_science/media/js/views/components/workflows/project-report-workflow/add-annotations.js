define([
    'underscore',
    'arches',
    'knockout',
    'js-cookie',
    'utils/annotation-utils',
    'geojson-extent',
    'leaflet',
    'views/components/map',
    'views/components/cards/select-feature-layers',
    'viewmodels/alert',
    'dom-to-image',
    'templates/views/components/workflows/project-report-workflow/add-annotations.htm',
    'bindings/leaflet'
], function(_, arches, ko, cookies, annotationUtils, geojsonExtent, L, MapComponentViewModel, selectFeatureLayersFactory, AlertViewModel, domToImage, addAnnotationsTemplate) {
    function viewModel(params) {
        const self = this;
        const physicalThings = params.physicalThings;
        let annotationGroups;
        let currentGroup;
        this.resourceData = ko.observable();
        this.physicalThingValue = ko.observable();
        this.physicalThingList = ko.observable();
        this.screenshotLink = ko.observable();
        this.summaryName = ko.observable();
        this.initialData = ko.observableArray();
        this.physicalThings = undefined;
        this.projectRelatedResources = undefined;

        this.canvases = ko.observableArray();
        this.selectedCanvas = ko.observable();
        this.canvasClick = (canvas) => {
            self.selectedCanvas(canvas.id);
        };
        this.selectedCanvas.subscribe(() => {
            self.refreshAnnotation();
        });
        
        this.screenshots = ko.observableArray();
        
        this.relatedResources = ko.observableArray();
        this.annotation = ko.observable();
        this.leafletConfig = ko.observable();
        this.annotationTableConfig = {
            "info": false,
            "paging": false,
            "scrollCollapse": true,
            "searching": false,
            "ordering": false,
            "columns": [
                null,
                null,
            ]
        };

        this.screenshotTableConfig = {
            "info": false,
            "paging": false,
            "scrollCollapse": true,
            "searching": false,
            "ordering": false,
            "columns": [
                null,
                null,
                null
            ]
        };

        this.deleteScreenshot = (screenshotName) => {
            self.screenshots(self.screenshots().filter(screenshot => screenshot.imageName != screenshotName));
        };

        this.refreshAnnotation = () => {
            self.leafletConfig(null);
            const selectedAnnotation = currentGroup.annotationCollection.annotations.find(
                (annotation) => annotation.featureCollection.features[0].properties.canvas === self.selectedCanvas()
            );
            self.leafletConfig(self.prepareAnnotation(selectedAnnotation.featureCollection));
            this.annotation({
                info: currentGroup.annotationCollection.canvases[self.selectedCanvas()].map(canvas => {
                    return {
                        tileId: canvas.tileId,
                        name: canvas.annotationName,
                        annotator: canvas.annotator,
                    };
                }),
                leafletConfig: self.leafletConfig(),
                featureCollection: annotationGroups,
            });
        };

        this.getManifestData = async(manifestURL) => {
            const response = await fetch(manifestURL);
            const json = await response.json();
            return json;
        };

        this.physicalThingValue.subscribe(async(value) => {
            currentGroup = annotationGroups.find(group => group.annotationCollection.parentResourceId == value);

            if (currentGroup){
                const canvases = await Promise.all(Object.keys(currentGroup.annotationCollection.canvases).map(
                    async(canvas) => {
                        const manifestData = await self.getManifestData(currentGroup.annotationCollection.canvases[canvas][0].manifest);
                        const currentCanvas = manifestData?.sequences?.[0].canvases.find((x) => x.images[0].resource.service['@id'] === canvas);
                        return {
                            id: canvas,
                            label: currentCanvas.label,
                            thumbnail: currentCanvas.thumbnail['@id'],
                        };
                    }));
                self.canvases(canvases);
                self.selectedCanvas(self.canvases()[0]?.id);
                self.refreshAnnotation();
                this.summaryName(`Annotation Summary for ${self.physicalThingList()?.find(thing => thing.id == self.physicalThingValue())?.text}`);
            } else {
                self.summaryName(null);
                self.canvases([]);
                self.leafletConfig(null);
                self.annotation(null);
            }
        });

        const fetchResource = async function(resourceid) {
            const response = await window.fetch(arches.urls.api_resources(resourceid) + '?format=json&compact=false&v=beta');

            if (response.ok) {
                return await response.json();
            } else { 
                throw('error retrieving resource', response); // throw - this should never happen. 
            }
        };

        (async() => {
            const labelBasedresources = await Promise.all(physicalThings.map(async(x) => await fetchResource(x)));
            annotationGroups = await Promise.all(labelBasedresources.map(async(x) => await annotationUtils.compressFeatures(x)));
            const currentGroup = annotationGroups?.[0];

            self.physicalThingList(annotationGroups.map((annotation) => {
                return {
                    text: annotation.annotationCollection.parentDisplayName,
                    id: annotation.annotationCollection.parentResourceId
                };
            }));
            self.physicalThingValue(currentGroup?.annotationCollection.parentResourceId);
            
        })();
        this.map = ko.observable();
        this.selectedAnnotationTileId = ko.observable();
        this.annotationTableConfig = {
            "info": false,
            "paging": false,
            "scrollCollapse": true,
            "searching": false,
            "ordering": false,
            "columns": [
                null,
                null,
            ]
        };
        const popupHtml = `
        <div class="mapboxgl-popup-content">
            <button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup" data-bind="click: closePopup">×</button>
            <div class="hover-feature-title-bar">
                <div class="hover-feature-title">
                    <span class="" data-bind="text: name"></span>
                </div>
            </div>
            <div class="hover-feature-body">
                <div class="hover-feature" data-bind="html: description"></div>
                <div class="hover-feature-metadata">
                    Resource Model:
                    <span data-bind="text: graphName"></span>
                </div>
                <div class="hover-feature-metadata">
                    ID:
                    <span data-bind="text: resourceinstanceid"></span>
                </div>
            </div>
            <div class="hover-feature-footer">
                <a data-bind="click: function () {
                    window.open(reportURL + resourceinstanceid);
                }" href="javascript:void(0)">
                    <i class="ion-document-text"></i>
                    Report
                </a>
            </div>
        </div>`;

        this.screenshot = async() => {
            if (!self.leafletConfig()) { return; }
            const currentdate = new Date();
            const url = await domToImage.toPng(document.getElementById('annotation-report'), {bgcolor: '#ffffff'});
            const blob = await domToImage.toBlob(document.getElementById('annotation-report'), {bgcolor: '#ffffff'});
            const imageName = `${currentdate.getFullYear()}-${currentdate.getMonth() + 1}-${currentdate.getDate()} - ${Date.now()}.png`;
            self.screenshots.push({imageName, url, blob});
        };

        this.prepareAnnotation = function(featureCollection) {
            var canvas = featureCollection.features[0].properties.canvas;

            var afterRender = function(map) {
                const iiifLayer = L.tileLayer.iiif(canvas + '/info.json');
                iiifLayer.addTo(map);
                var extent = geojsonExtent(featureCollection);
                const geojsonLayer = L.geoJson(featureCollection, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, feature.properties);
                    },
                    style: function(feature) {
                        return feature.properties;
                    },
                    onEachFeature: function(feature, layer) {
                        const label = currentGroup?.annotationCollection.canvases?.[feature.properties.canvas]?.find(canvasFeature => canvasFeature.tileId == feature.properties.tileId)?.annotationLabel;
                        layer.bindTooltip(label, {permanent: true, opacity: 0.7}).openTooltip();
                        if (feature.properties.active === false){
                            var popup = L.popup({
                                closeButton: false,
                                maxWidth: 250
                            })
                                .setContent(popupHtml)
                                .on('add', function() {
                                    const titleArrary = feature.properties.name.split('[');
                                    const title = titleArrary[0].trim();
                                    const type = titleArrary[1].startsWith('Region') ? 'Analysis Area':
                                        titleArrary[1].startsWith('Sample Area') ? 'Sample Area':
                                            'Part';
                                    const parent = titleArrary[1].startsWith('Region') ? titleArrary[1].replace('Region of ','').replace(']',''):
                                        titleArrary[1].startsWith('Sample Area') ? titleArrary[1].replace('Sample Area of ','').replace(']',''):
                                            titleArrary[1].replace(']','');
                                    const description = `${title} is a ${type} of ${parent} created before`;
                                    var popupData = {
                                        closePopup: function() {
                                            popup.remove();
                                        },
                                        name: feature.properties.name,
                                        description: description,
                                        graphName: 'Physical Thing',
                                        resourceinstanceid: feature.properties.sampleAreaResourceId,
                                        reportURL: arches.urls.resource_report
                                    };
                                    var popupElement = popup.getElement()
                                        .querySelector('.mapboxgl-popup-content');
                                    ko.applyBindingsToDescendants(popupData, popupElement);
                                });
                            layer.bindPopup(popup);
                        }
                        layer.on('click', function() {
                            if (feature.properties && feature.properties.tileId && feature.properties.active !== false){
                                self.highlightAnnotation(feature.properties.tileId);
                            }
                        });
                    }
                });
                iiifLayer.on('load', function() {
                    map.fitBounds([
                        [extent[1]-1, extent[0]-1],
                        [extent[3]+1, extent[2]+1]
                    ]);
                });

                map.addLayer(geojsonLayer);
                
                L.control.fullscreen().addTo(map);
                self.map(map);
            };

            return {
                center: [0, 0],
                crs: L.CRS.Simple,
                zoom: 0,
                afterRender: afterRender
            };
        };

        this.screenshots.subscribe(() => {
            if(self.initialData().length === self.screenshots().length && self.initialData().every((value, index) => value === self.screenshots()[index])) {
                params.form.dirty(false);
            } else {
                params.form.dirty(true);
            }
        });

        params.form.initialize = () => {
            self.screenshots(params.form.value()?.screenshots || []);
            self.initialData(params.form.value() || []);
        };

        params.form.save = async() => {
            params.form.complete(false);
            params.form.saving(true);
            const screenshots = await Promise.all(this.screenshots().map(async(screenshot) => {
                if(screenshot.blob){
                    const formData = new window.FormData();
                    formData.append("file", screenshot.blob);
                    formData.append("fileName", screenshot.imageName);
                    const response = await window.fetch(arches.urls.temp_file, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                        headers: {
                            "X-CSRFToken": cookies.get('csrftoken')
                        }
                    });
                    if(response.ok){
                        const responseJson = await response.json();
                        const fileId = responseJson['file_id'];
                        return {
                            imageName: screenshot.imageName, 
                            fileId
                        };
                    } else {
                        throw('error saving temp file!', response); // we can't continue - we have to be able to save these files since they'll be in the report.
                    }
                } else {
                    return screenshot;
                }
            }));
            params.form.value({ screenshots: screenshots });
            params.form.savedData({ screenshots: screenshots });
            params.form.saving(false);
            params.form.complete(true);
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
                            const defaultColor = feature.feature.properties.color;
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
        params.form.initialize();
    }

    ko.components.register('views/components/workflows/project-workflow-report/add-annotations', {
        viewModel: viewModel,
        template: addAnnotationsTemplate
    });

    return viewModel;
});
define([
    'knockout',
    'views/components/workflows/final-step',
    'geojson-extent',
    'views/components/map',
    'views/components/cards/select-feature-layers',
    'viewmodels/alert'
], function(ko, FinalStep, geojsonExtent, MapComponentViewModel, selectFeatureLayersFactory, AlertViewModel) {

    function viewModel(params) {
        FinalStep.apply(this, [params]);
        this.resourceData = ko.observable();
        this.relatedResources = ko.observableArray();

        this.getResourceData = function() {
            window.fetch(this.urls.api_resources(this.resourceid) + '?format=json&compact=false')
            .then(response => response.json())
            .then(data => this.resourceData(data))
        };

        this.getRelatedResources = function() {
            window.fetch(this.urls.related_resources + this.resourceid + "?paginate=false")
            .then(response => response.json())
            .then(data => this.relatedResources(data))
        };

        this.init = function(){
            this.getResourceData();
            this.getRelatedResources()
        };

        this.getResourceValue = function(obj, attrs, missingValue='none') {
            try {
                return attrs.reduce(function index(obj, i) {return obj[i]}, obj) || missingValue;
            } catch(e) {
                return missingValue;
            }
        };

        this.prepareMap = function(geojson, source) {
            var mapParams = {};
            if (geojson.features.length > 0) {
                mapParams.bounds = geojsonExtent(geojson);
                mapParams.fitBoundsOptions = { padding: 20 };
            }
            var sourceConfig = {};
            sourceConfig[source] = {
                    "type": "geojson",
                    "data": geojson
                };
            mapParams.sources = Object.assign(sourceConfig, mapParams.sources);
            mapParams.layers = selectFeatureLayersFactory(
                '', //resourceid
                source, //source
                undefined, //sourceLayer
                [], //selectedResourceIds
                true, //visible
                '#ff2222' //color
            );
            MapComponentViewModel.apply(this, [Object.assign({},  mapParams,
                {
                    "activeTab": ko.observable(false),
                    "zoom": null
                }
            )]);
        
            this.layers = mapParams.layers;
            this.sources = mapParams.sources;
        };

        this.init();
    }
    
    return viewModel;
});

define([
    'jquery',
    'knockout',
    'arches',
    'templates/views/components/workflows/review-dataset/select-dataset.htm'
], function($, ko, arches,selectDatasetStepTemplate) {
    function viewModel(params) {
        var self = this;
        this.digitalResourceGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
        this.physicalThingResourceId = ko.observable();
        this.relatedDigitalResources = ko.observableArray();

        this.dataLoaded = ko.observable(false);

        const getDigitalResources = async function(resourceid) {
            if(!resourceid){ return; }
            const url = `${arches.urls.root}digital-resources-by-object-parts/${resourceid}`;
            const result = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });
            if (result.ok) {
                const results = await result.json();
                const resources = results.resources;

                resources.forEach(function(resource) {
                    resource.selected = ko.observable(false);
                    if(params.value()) {
                        params.value().digitalResources.forEach(function(val) {
                            if (val.resourceid === resource.resourceid) {
                                resource.selected(val.selected);
                            }
                        });
                    }
                });
                const digitalResourcesBelongToParentOrSample = resources.filter(resource => {
                    return (!resource.isdirect && results.type !== 'sample') ||
                        (resource.isdirect && results.type === 'sample');
                });
                self.relatedDigitalResources(digitalResourcesBelongToParentOrSample);
                self.dataLoaded(true);
            }
        };

        this.selectedDigtalResources = ko.pureComputed(function() {
            return self.relatedDigitalResources().map(function(resource){
                return {
                    resourceid: resource.resourceid,
                    partresourceid: resource.partresourceid,
                    selected: resource.selected()
                };
            });
        });

        this.selectedDigtalResources.subscribe(function(val) {
            if(val && val.length > 0){
                const data = {digitalResources: val, resourceid: self.physicalThingResourceId()};
                params.value(data);
            } else {
                params.value(undefined);
            }
        });

        this.physicalThingResourceId.subscribe(getDigitalResources);

        if (params.value()) {
            self.physicalThingResourceId(params.value().resourceid);
            getDigitalResources(params.value().resourceid);
        }
    }

    ko.components.register('select-dataset', {
        viewModel: viewModel,
        template: selectDatasetStepTemplate
    });
    return viewModel;
});

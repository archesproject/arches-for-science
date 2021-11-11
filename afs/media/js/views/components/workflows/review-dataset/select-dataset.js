define([
    'jquery',
    'knockout',
    'arches',
], function($, ko, arches) {
    function viewModel(params) {
        var self = this;
        this.digitalResourceGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
        this.physicalThingResourceId = ko.observable(params.physicalThingResourceId);
        this.relatedDigitalResources = ko.observableArray();
        this.dataLoaded = ko.observable(false);

        const getDigitalResources = async function(resourceid) {
            const url = `${arches.urls.root}digital-resources-by-object-parts/${resourceid}`;
            const result = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });
            if (result.ok) {
                const results = await result.json();
                const resources = results.resources;
                resources.forEach(resource => resource.selected = ko.observable(false));
                self.relatedDigitalResources(resources);
                self.dataLoaded(true);
            }
        };

        this.selectedDigtalResources = ko.pureComputed(function() {
            return self.relatedDigitalResources().map(function(resource){
                return {
                    resourceid: resource.resourceid,
                    selected: resource.selected()
                };
            });
        });

        this.selectedDigtalResources.subscribe(function(val) {
            const data = {digitalResources: val, resourceid: self.physicalThingResourceId()};
            params.value(data);
        });

        getDigitalResources(params.physicalThingResourceId);
        this.physicalThingResourceId.subscribe(getDigitalResources);
    }

    ko.components.register('select-dataset', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/review-dataset/select-dataset.htm' }
    });
    return viewModel;
});

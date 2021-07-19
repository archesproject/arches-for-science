define([
    'knockout',
    'arches',
], function(ko, arches) {
    function viewModel(params) {
        var self = this;
        this.digitalResourceGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
        this.physicalThingResourceId = ko.observable(params.form.externalStepData.selectobjectstep.data["sample-object-resource-instance"][0][1][0].resourceId());
        this.relatedDigitalResources = ko.observableArray([]);
        this.dataLoaded = ko.observable(false);
        
        $.ajax({
            url: arches.urls.related_resources + this.physicalThingResourceId(),
            context: this,
            dataType: 'json',
            }).done(function(data) {
            // console.log(data);
                self.relatedDigitalResources(data.related_resources.related_resources
                    .filter(function(related_resource) {
                        return related_resource.graph_id == '707cbd78-ca7a-11e9-990b-a4d18cec433a'})
                )

                self.relatedDigitalResources().forEach(function(resource) {
                    resource.selected = ko.observable().extend({ deferred: true });
                    if(params.value()) {
                        params.value().find(function(val) {
                            if (val.resourceid == resource.resourceinstanceid) {
                                resource.selected(true);
                            }
                            else {
                                resource.selected(false);
                            }
                        });
                    }
                    self.dataLoaded(true);
                })

                self.selectedDigtalResources = ko.pureComputed(function() {
                        return self.relatedDigitalResources().map(function(resource){
                            return {
                                resourceid: resource.resourceinstanceid,
                                selected: resource.selected()
                            }
                        })
                    })

                self.selectedDigtalResources.subscribe(function(val) {
                    params.value(val);
                })



        })

    }

    ko.components.register('select-dataset', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/review-dataset/select-dataset.htm' }
    });
    return viewModel;
});

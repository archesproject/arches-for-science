define([
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'utils/resource',
    'templates/views/components/workflows/project-report-workflow/project-report-select.htm'
], function(_, arches, ko, koMapping, resourceUtils, projectReportSelectTemplate) {
    function viewModel(params) {
        this.physicalThingPartOfSetNodeId = '63e49254-c444-11e9-afbe-a4d18cec433a';
        this.physicalThingPhysicalPartofObjectNodeId = 'b240c366-8594-11ea-97eb-acde48001122';
        this.physThingSetNodegroupId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a';

        var self = this;
        let initializing = true;
        this.projectValue = ko.observable();
        this.physicalThingsValue = ko.observable();
        this.hasSetWithPhysicalThing = ko.observable();
        this.setsThatBelongToTheProject = ko.observable();
        this.projectNameValue = ko.observable();
        this.locked = params.form.locked;

        this.updateValues = function(val){
            if (val !== null) {
                self.projectValue(val.project);
                self.physicalThingsValue(val.physicalThings);
                self.setsThatBelongToTheProject(val.physicalThingSet);
            }
        };

        if (params.value()) {
            this.updateValues(params.value());
        }

        this.projectValue.subscribe(function(val){
            if (!initializing) {
                self.physicalThingsValue(null);
            }
            initializing = false;
            if (val) {
                var res = resourceUtils.lookupResourceInstanceData(val);
                res.then(
                    function(data){
                        self.projectNameValue(data._source.displayname);
                        let setTileResourceInstanceIds;
                        let setTile = data._source.tiles.find(function(tile){
                            return tile.nodegroup_id === self.physThingSetNodegroupId;
                        });
                        if (setTile?.data?.[self.physThingSetNodegroupId]?.length) {
                            self.setsThatBelongToTheProject(null);
                            setTileResourceInstanceIds = setTile.data[self.physThingSetNodegroupId].map((instance) => instance.resourceId);
                            if (setTileResourceInstanceIds) {
                                self.setsThatBelongToTheProject(setTileResourceInstanceIds);
                            }
                        } else {
                            self.hasSetWithPhysicalThing(false);
                        }
                    }
                );
            }
        });

        this.termFilter = ko.pureComputed(function(){
            if (ko.unwrap(self.setsThatBelongToTheProject)) {
                self.hasSetWithPhysicalThing(true);
                const query = Array(2).fill({"op": "and"});
                query[0][self.physicalThingPartOfSetNodeId] = {
                    "op": "or",
                    "val":  ko.unwrap(self.setsThatBelongToTheProject)
                };
                query[1][self.physicalThingPhysicalPartofObjectNodeId] = {
                    "op":"not_null",
                    "val":""
                };
                return function(term, queryString) {
                    queryString.set('advanced-search', JSON.stringify(query));
                    if (term) {
                        queryString.set('term-filter', JSON.stringify([{"context":"", "id": term,"text": term,"type":"term","value": term,"inverted":false}]));
                    }
                };
            } else {
                return null;
            }
        });


        this.physicalThingsValue.subscribe(() => {
            if (self.physicalThingsValue()) {
                params.value({
                    project: self.projectValue(),
                    physicalThings: self.physicalThingsValue(),
                    physicalThingSet: self.setsThatBelongToTheProject(),
                });
            }
        });
    }

    ko.components.register('project-report-select', {
        viewModel: viewModel,
        template: projectReportSelectTemplate
    });

    return viewModel;
});
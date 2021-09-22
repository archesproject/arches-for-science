define(['underscore', 'knockout', 'arches', 'utils/report','bindings/datatable'], function(_, ko, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/actor-relations', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.dataConfig = {
                owner: 'current owner',
            }

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.material = ko.observable();
            self.visible = {
                owner: ko.observable(true),
            }
            self.owners = ko.observableArray();
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.owners(params.data.owners);
            } else {
                let ownerData = self.getRawNodeValue(params.data(), self.dataConfig.owner);
                
                if(ownerData?.instance_details.length) {
                    self.owners(ownerData.instance_details.map(x => {
                        const name = x.display_value;
                        const link = self.getResourceLink(x);
                        return { name, link };
                    }));
                }

            } 

        },
        template: { require: 'text!templates/views/components/reports/scenes/actor-relations.htm' }
    });
});
define(['underscore', 'knockout', 'arches', 'utils/report'], function(_, ko, arches, reportUtils) {
    return ko.components.register('name-scene', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.nameTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(5).fill(null)
            };

            self.visible = ko.observable(true);
            self.card = params.card;
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.names = ko.observable();
            self.identifiers = ko.observable();
            self.exactMatch = ko.observable();
            self.type = ko.observable();

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.names(params.data.names);
                self.identifiers(params.data.identifiers);
                self.exactMatch(params.data.exactMatch);
                self.type(params.data.type);
            } else {
                self.names(params.data()["Name"].map(x => {
                    const type = self.getNodeValue(x, "name_type");
                    const content = self.getNodeValue(x, "name_content");
                    const language = self.getNodeValue(x, "name_language");
                    const label = self.getNodeValue(x, "name_label");
                    const source = self.getNodeValue(x, "name_source");
                    const tileid = x?.['@tile_id'];
                    return { type, content, language, label, source, tileid }
                }));

                self.identifiers(params.data()["Identifier"].map(x => {
                    const type = self.getNodeValue(x, "identifier_type");
                    const content = self.getNodeValue(x, "identifier_content");
                    const label = self.getNodeValue(x, "identifier_label");
                    const source = self.getNodeValue(x, "identifier_source");
                    const tileid = x?.['@tile_id'];
                    return { type, content, label, source, tileid }
                }));

                self.exactMatch(self.getNodeValue(params.data(), "exactmatch"));
                self.type(self.getNodeValue(params.data(), "type"));
            } 

        },
        template: { require: 'text!templates/views/components/reports/scenes/name.htm' }
    });
});
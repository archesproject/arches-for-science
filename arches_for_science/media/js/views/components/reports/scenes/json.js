import ko from 'knockout'; 
import jsonSceneTemplate from 'templates/views/components/reports/scenes/json.htm';
import reportUtils from 'utils/report';
import arches from 'arches';
import 'viewmodels/widget';
import 'bindings/codemirror';

export default ko.components.register('views/components/reports/scenes/json', {
    viewModel: function(params) {
        var self = this;

        Object.assign(self, reportUtils);
        self.selectedJSON = ko.observable();
        self.selectedFormat = ko.observable();
        self.codeMirrorJsonLDMode = ko.observable();
        self.codeMirrorJsonMode = ko.observable();
        self.resourceInstanceId = params.resourceInstanceId;
        self.json = {};
        self.visible = {
            json: ko.observable(true)
        };

        self.setSelectedJson = async(format) => {
            if(!self.json[format]){
                const response = await fetch(`${arches.urls.api_resources(self.resourceInstanceId)}?format=${format}`);
                self.json[format] = response.ok ? await response.json() : arches.translations.jsonError; // let the user know if the json couldn't be retrieved.
            }
            self.selectedJSON(JSON.stringify(self.json[format], null, 2));
            self.selectedFormat(format);
            (format == 'json-ld' ? self.codeMirrorJsonLDMode(true) && self.codeMirrorJsonMode(false) : self.codeMirrorJsonLDMode(false) && self.codeMirrorJsonMode(true));
        };
        self.setSelectedJson('json');
    },
    template: jsonSceneTemplate
});
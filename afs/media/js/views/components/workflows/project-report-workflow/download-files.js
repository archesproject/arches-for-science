define([
    'jquery',
    'js-cookie',
    'knockout',
    'arches',
    'templates/views/components/workflows/project-report-workflow/download-files.htm',
], function($, Cookies, ko, arches, downloadFilesTemplate) {
    function viewModel(params) {
        var self = this;

        this.projectValue = params.selectedProject;
        this.samplers = ko.observable();

        this.projectValue = 'ed883b44-74c3-43e4-b88c-5bb8d920c4b8';
        this.projectName = 'Mexican';
        this.physicalThingNameValue = "Burrito";
        this.physicalThingValue = "79f80542-15e5-4fbe-84b1-c98461e8965a";
        const collectionGraphId = '1b210ef3-b25c-11e9-a037-a4d18cec433a';
        const physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
        const digitalResourcegGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
        const fileNodeId = '7c486328-d380-11e9-b88e-a4d18cec433a';
        this.relatedPhysicalThings = ko.observableArray();
        this.message = ko.observable();

        this.formatSize = function(size) {
            var bytes = size;
            if(bytes == 0) return '0 Byte';
            var k = 1024;
            var dm = 2;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return '(' + '<strong>' + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '</strong>' + sizes[i] + ')';
        };

        this.getFilesFromCollection = async() => {
            let projectCollection, physicalThings, physicalThing, digitalResources, relatedFiles;
            
            await window.fetch(arches.urls.related_resources + self.projectValue  + "?paginate=false")
                .then(response => response.json())
                .then(json => {
                    projectCollection = json.related_resources.find(res => res.graph_id == collectionGraphId);
                });
            await window.fetch(arches.urls.related_resources + projectCollection.resourceinstanceid  + "?paginate=false")
                .then(response => response.json())
                .then(json => {
                    physicalThings = json.related_resources.filter(res => res.graph_id == physicalThingGraphId);
                });
            for (const thing of physicalThings) {
                await window.fetch(arches.urls.related_resources + thing.resourceinstanceid  + "?paginate=false")
                    .then(response => response.json())
                    .then(json => {
                        physicalThing = json.resource_instance;
                        digitalResources = json.related_resources.filter(res => res.graph_id == digitalResourcegGraphId);
                        relatedFiles = digitalResources.reduce((acc1, res) => 
                            acc1.concat(res.tiles.reduce((acc2, tile) => {
                                if (tile.nodegroup_id == fileNodeId){
                                    acc2 = acc2.concat(tile.data[fileNodeId].map(data => {
                                        data['download'] = ko.observable();
                                        return data;
                                    }));
                                }
                                return acc2;
                            }, [])),
                        []);
                    });
                self.relatedPhysicalThings.push({ ...physicalThing, relatedFiles});
            }
        };
        this.getFilesFromCollection();
        
        this.downloadFiles = () => {
            const files = self.relatedPhysicalThings().reduce(
                (acc, thing) => acc.concat(thing.relatedFiles.filter(
                    file => file.download())), [])
                .map(file => {
                    return {'name': file.name, 'fileid': file.file_id, 'project': self.projectName};
                });
            const formData = new window.FormData();

            formData.append('files', JSON.stringify(files));
            window.fetch(arches.urls.download_files, {
                method: 'POST', 
                credentials: 'include',
                body: formData,
                headers: {
                    "X-CSRFToken": Cookies.get('csrftoken')
                }
            }).then((response) => response.json())
                .then((json) => self.message(json.message));
        };
    }

    ko.components.register('download-files', {
        viewModel: viewModel,
        template: downloadFilesTemplate
    });
    return viewModel;
});

define([
    'jquery',
    'js-cookie',
    'knockout',
    'arches',
    'viewmodels/alert-json',
    'templates/views/components/workflows/project-report-workflow/download-project-files.htm',
], function($, Cookies, ko, arches, JsonErrorAlertViewModel, downloadFilesTemplate) {
    function viewModel(params) {
        var self = this;

        this.projectValue = params.projectId;
        const physicalThings = params.physicalThings;

        const observationGraphId = '615b11ee-c457-11e9-910c-a4d18cec433a';
        const digitalResourcegGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
        const collectionGraphId = '1b210ef3-b25c-11e9-a037-a4d18cec433a';
        const physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
        const fileNodeId = '7c486328-d380-11e9-b88e-a4d18cec433a';
        const objectObservedNodeId = "cd412ac5-c457-11e9-9644-a4d18cec433a";
        const removalFromObjectNodegroupId = "b11f217a-d2bc-11e9-8dfa-a4d18cec433a";
        const removedFromNodeId = "38814345-d2bd-11e9-b9d6-a4d18cec433a";
        const fileStatementContentNodeId = 'ca227726-78ed-11ea-a33b-acde48001122';
        this.relatedObservations = ko.observableArray();
        this.message = ko.observable();

        this.ready = ko.computed(() => {
            return self.relatedObservations().find((observation) => {
                return !!observation.relatedFiles().find(file => file.selected() == true );
            });
        });

        this.fileTableConfig = {
            columns: Array(4).fill(null)
        };

        this.expandAll = function(bool) {
            self.relatedObservations().forEach((observation) => {
                observation.expanded(bool);
            });
        };

        this.selectAll = function(bool) {
            self.relatedObservations().forEach((observation) => {
                observation.relatedFiles().forEach(file => file.selected(bool));
            });
            self.expandAll(true);
        };
        this.getFilesFromObservation = async() => {
            const projectResponse = await window.fetch(arches.urls.related_resources + self.projectValue  + "?paginate=false");
            const projectJson = await projectResponse.json();

            const collectionForProject = projectJson.related_resources.find(res => res.graph_id === collectionGraphId).resourceinstanceid;
            const collectionResponse = await window.fetch(arches.urls.related_resources + collectionForProject  + "?paginate=false");
            const collectionJson = await collectionResponse.json();

            const projectPhysicalThings = collectionJson.related_resources.filter(res => res.graph_id === physicalThingGraphId)
                .filter(res => {
                    const removedFromTile = res.tiles.find(tile => tile.nodegroup_id === removalFromObjectNodegroupId);
                    const removedFrom = removedFromTile?.data[removedFromNodeId].map(rr => rr.resourceId);
                    return removedFrom?.some(res => physicalThings.includes(res)) || physicalThings.includes(res.resourceinstanceid);
                }).map(res => res.resourceinstanceid);

            self.projectName = projectJson.resource_instance.displayname;
            const projectObservations = projectJson.related_resources.filter(res => res.graph_id == observationGraphId)
                .filter(res => {
                    const objectTile = res.tiles.find(tile => tile.nodegroup_id === objectObservedNodeId);
                    const object = objectTile?.data[objectObservedNodeId][0]['resourceId'];
                    return projectPhysicalThings.includes(object);
                });

            for (const projectObservation of projectObservations) {
                const relatedFiles = ko.observableArray();
                const response = await window.fetch(arches.urls.related_resources + projectObservation.resourceinstanceid  + "?paginate=false");
                
                if(response.ok) {
                    const json = await response.json();
                    const observation = json.resource_instance;
                    observation.expanded = ko.observable();
                    observation.description = observation.descriptors[arches.activeLanguage].description;
                    const digitalResources = json.related_resources.filter(res => res.graph_id == digitalResourcegGraphId);
                    digitalResources.forEach((res) => 
                        res.tiles.forEach((tile) => {
                            if (tile.nodegroup_id == fileNodeId) {
                                const selected = ko.observable();
                                const interpretation = res.tiles.find(tile2 => tile2.parenttile_id == tile.tileid)?.data[fileStatementContentNodeId][arches.activeLanguage].value;
                                const file = { ...tile.data[fileNodeId][0], interpretation, selected };
                                relatedFiles.push(file);
                            }
                        })
                    );
                    self.relatedObservations.push({ ...observation, relatedFiles});
                }
            }
            self.relatedObservations.sort((a,b) => b.relatedFiles().length - a.relatedFiles().length);
        };

        this.getFilesFromObservation();
        
        this.downloadFiles = () => {
            if (!self.ready()) {
                return;
            }
            const files = self.relatedObservations().reduce(
                (acc, observation) => acc.concat(observation.relatedFiles().filter(
                    file => file.selected())), [])
                .map(file => {
                    return {'name': file.name, 'fileid': file.file_id, 'project': self.projectName};
                });
            const formData = new window.FormData();

            formData.append('files', JSON.stringify(files));
            window.fetch(arches.urls.download_project_files, {
                method: 'POST', 
                credentials: 'include',
                body: formData,
                headers: {
                    "X-CSRFToken": Cookies.get('csrftoken')
                }
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw response;
                    }
                })
                .then((json) => self.message(json.message))
                .catch((response) => {
                    response.json().then(
                        error => {
                            params.pageVm.alert(
                                new JsonErrorAlertViewModel(
                                    'ep-alert-red',
                                    error,
                                    null,
                                    function(){}
                                )
                            );
                        });
                });
        };
    }

    ko.components.register('download-project-files', {
        viewModel: viewModel,
        template: downloadFilesTemplate
    });
    return viewModel;
});

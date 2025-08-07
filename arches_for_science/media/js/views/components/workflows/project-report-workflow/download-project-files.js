define([
    'knockout',
    'arches',
    'templates/views/components/workflows/project-report-workflow/download-project-files.htm',
], function(ko, arches, downloadFilesTemplate) {
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
        this.startIds = ko.observableArray();
        this.message = ko.observable();

        this.selectedFiles = ko.observableArray();

        if (ko.unwrap(params.value)) {
            const files =  params.value().files;
            files?.forEach((file) => {
                self.startIds.push(file.fileid);                    
                self.selectedFiles.push(file);
            });
        };

        this.selectedFiles.subscribe((val) => {
            params.value({ files: val });
        });
        
        params.value({ files: [] });

        this.numberOfSelectedFiles = ko.computed(() => {
            const count = self.relatedObservations().reduce((acc, observation) => {
                return acc + observation.relatedFiles().filter(file => file.selected()).length;
            }, 0);
            return count;
        });

        this.numberOfFiles = ko.computed(() => {
            const count = self.relatedObservations().reduce((acc, observation) => {
                return acc + observation.relatedFiles().length;
            }, 0);
            return count;
        });

        this.fileTableConfig = {
            columns: Array(4).fill(null)
        };

        this.expandAll = function(bool) {
            self.relatedObservations().forEach((observation) => {
                observation.expanded(bool);
            });
        };

        this.toggleSelection = function(observation) {
            const noFilesSelected = observation.relatedFiles().
                filter(file => file.selected()).length === 0;
            const selectedValue = noFilesSelected;

            observation.relatedFiles().forEach(file => file.selected(selectedValue));
            if(selectedValue) {
                observation.expanded(true);
            }
        };

        const addSelectedFiles = () => {
            self.selectedFiles.removeAll();
            self.relatedObservations().forEach((observation) => {
                observation.relatedFiles().forEach((file) => {
                    if (file.selected()) {
                        self.selectedFiles.push({
                            'name': file.name,
                            'fileid': file.file_id,
                            'project': self.projectName,
                            'interpretation': file.interpretation,
                            'observation': observation.displayname,
                            'parameters': observation.description
                        });
                    }
                });
            });
        };

        params.form.reset = () => {
            self.selectedFiles.removeAll();
            self.relatedObservations().forEach((observation) => {
                observation.relatedFiles().forEach((file) => {
                    if (self.startIds().includes(file.file_id)) {
                        file.selected(true);
                    } else {
                        file.selected(false);
                    }
                });
            });
            addSelectedFiles();
        };

        this.getFilesFromObservation = async() => {
            const projectResponse = await window.fetch(arches.urls.related_resources + self.projectValue  + "?paginate=false");
            const projectJson = await projectResponse.json();

            const collectionForProject = projectJson.related_resources.find((res) => res.graph_id === collectionGraphId).resourceinstanceid;
            const collectionResponse = await window.fetch(arches.urls.related_resources + collectionForProject  + "?paginate=false");
            const collectionJson = await collectionResponse.json();

            const projectPhysicalThings = collectionJson.related_resources.filter((res) => res.graph_id === physicalThingGraphId)
                .filter((res) => {
                    const removedFromTile = res.tiles.find((tile) => tile.nodegroup_id === removalFromObjectNodegroupId);
                    const removedFrom = removedFromTile?.data[removedFromNodeId].map((rr) => rr.resourceId);
                    return removedFrom?.some((res) => physicalThings.includes(res)) || physicalThings.includes(res.resourceinstanceid);
                }).map((res) => res.resourceinstanceid);

            self.projectName = projectJson.resource_instance.displayname;
            const projectObservations = projectJson.related_resources.filter((res) => res.graph_id == observationGraphId)
                .filter((res) => {
                    const objectTile = res.tiles.find((tile) => tile.nodegroup_id === objectObservedNodeId);
                    const object = objectTile?.data[objectObservedNodeId][0]['resourceId'];
                    return projectPhysicalThings.includes(object);
                });

            const selectedFileIds = self.selectedFiles().map((file) => file.fileid);
            for (const projectObservation of projectObservations) {
                const relatedFiles = ko.observableArray();
                const response = await window.fetch(arches.urls.related_resources + projectObservation.resourceinstanceid  + "?paginate=false");
                
                if(response.ok) {
                    const json = await response.json();
                    const observation = json.resource_instance;
                    observation.expanded = ko.observable();
                    observation.description = observation.descriptors[arches.activeLanguage].description;
                    const digitalResources = json.related_resources.filter((res) => res.graph_id == digitalResourcegGraphId);
                    digitalResources.forEach((res) => 
                        res.tiles.forEach((tile) => {
                            if (tile.nodegroup_id == fileNodeId) {
                                const selected = ko.observable();
                                if (selectedFileIds.includes(tile.data[fileNodeId][0].file_id)) { selected(true); }
                                selected.subscribe(() => addSelectedFiles());
                                const interpretation = res.tiles.find((tile2) => tile2.parenttile_id == tile.tileid)?.data[fileStatementContentNodeId][arches.activeLanguage].value;
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
    }

    ko.components.register('download-project-files', {
        viewModel: viewModel,
        template: downloadFilesTemplate
    });
    return viewModel;
});
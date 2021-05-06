define(['underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource', 'utils/physical-thing'], function(_, ko, arches, TabbedReportViewModel, resourceUtils, physicalThingUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                var IdentifierContentnodeid = '22c169b5-b498-11e9-bdad-a4d18cec433a';
                var IdentifierType = '22c15cfa-b498-11e9-b5e3-a4d18cec433a';
                var GallerySystemsTMSid = '26094e9c-2702-4963-adee-19ad118f0f5a';
                var CreatorProductionEvent = 'cc16893d-b497-11e9-94b0-a4d18cec433a';
                var Statement = '1953016e-b498-11e9-9445-a4d18cec433a';
                var PartOfSet = '63e49254-c444-11e9-afbe-a4d18cec433a';
                var StatementType = '1952e470-b498-11e9-b261-a4d18cec433a';
                this.gallerySystemsTMSid = resourceUtils.getNodeValues({
                    nodeId: IdentifierContentnodeid,
                    where: {
                        nodeId: IdentifierType,
                        contains: GallerySystemsTMSid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.artists = ko.observableArray([]);
                this.artistObjects = resourceUtils.getNodeValues({
                    nodeId: CreatorProductionEvent,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.artistObjects.forEach(function(artistObject) {
                    resourceUtils.lookupResourceInstanceData(artistObject['resourceId'])
                        .then(function(data) {
                            self.artists.push({ name: data._source.displayname, link: arches.urls.resource + '/' + artistObject['resourceId'] });
                        });
                });

                var DescriptionConceptvalueid = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                this.description = resourceUtils.getNodeValues({
                    nodeId: Statement,
                    where: {
                        nodeid: StatementType,
                        contains: DescriptionConceptvalueid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.activities = ko.observableArray();
                var collectionSet = resourceUtils.getNodeValues({
                    nodeId: PartOfSet,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                collectionSet.forEach(function(relatedResourceItem) {
                    resourceUtils.lookupResourceInstanceData(relatedResourceItem.resourceId)
                        .then(function(data) {
                            self.activities.push({ name: data._source.displayname, link: arches.urls.resource + '/' + relatedResourceItem.resourceId });
                        });
                });


                var getLabel = function(object) {
                    var label = object.label;
                    if (Array.isArray(label)) {
                        label = object.label[0]["@value"];
                    }
                    return label;
                };

                this.manifests = ko.observableArray();
                var parseManifestJson = function(manifestData) {
                    var sequences = manifestData ? manifestData.sequences : [];
                    var canvases = [];
                    sequences.forEach(function(sequence) {
                        if (sequence.canvases) {
                            sequence.label = getLabel(sequence);
                            sequence.canvases.forEach(function(canvas) {
                                canvas.label = getLabel(canvas);
                                if (typeof canvas.thumbnail === 'object')
                                    canvas.thumbnail = canvas.thumbnail["@id"];
                                else if (canvas.images && canvas.images[0] && canvas.images[0].resource)
                                    canvas.thumbnail = canvas.images[0].resource["@id"];
                                canvases.push(canvas);
                            });
                        }
                    });
                    self.manifests.push(manifestData);
                    return canvases;
                };

                var getManifestData = function(manifestURLs) {
                    manifestURLs.forEach(function(manifestURL) {
                        window.fetch(manifestURL)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(manifestData) {
                                parseManifestJson(manifestData);
                            });
                    });
                };

                physicalThingUtils.getManifests(this.report.get('tiles')).then(function(manifests) {
                    getManifestData(manifests);
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});
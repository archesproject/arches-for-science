define(['underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function(_, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                var Identifier_Content_nodeid = '22c169b5-b498-11e9-bdad-a4d18cec433a';
                var Identifier_Type = '22c15cfa-b498-11e9-b5e3-a4d18cec433a';
                var GallerySystemsTMSid = '26094e9c-2702-4963-adee-19ad118f0f5a';
                this.gallerySystemsTMSid = resourceUtils.getNodeValues({
                    nodeId: Identifier_Content_nodeid,
                    where: {
                        nodeId: Identifier_Type,
                        contains: GallerySystemsTMSid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.artists = ko.observableArray();
                this.artistIds = resourceUtils.getNodeValues({
                    widgetLabel: 'Production (partitioned).carried out by',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.artistIds.forEach(function(resourceid) {
                    resourceUtils.lookupResourceInstanceData(resourceid)
                        .then(function(data) {
                            self.artists.push({ name: data._source.displayname, link: arches.urls.resource + '/' + resourceid });
                        })
                })

                var Description_Concept_valueid = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                this.description = resourceUtils.getNodeValues({
                    widgetLabel: 'Statement about Thing.Text of Statement',
                    where: {
                        widgetLabel: 'Statement about Thing.Type of Statement',
                        contains: Description_Concept_valueid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.activities = ko.observableArray();
                var collectionSet = resourceUtils.getNodeValues({
                    widgetLabel: 'In Collection or Set.member of',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                collectionSet.forEach(function(resourceid) {
                    resourceUtils.lookupResourceInstanceData(resourceid)
                        .then(function(data) {
                            self.activities.push({ name: data._source.displayname, link: arches.urls.resource + '/' + resourceid });
                        })
                })


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

                var getManifestData = function(manifestURL) {
                    window.fetch(manifestURL)
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(manifestData) {
                            parseManifestJson(manifestData);
                        })
                };

                var VisualWork_UsedImage_nodeid = '9743a1b2-8591-11ea-97eb-acde48001122';
                var DigitalResource_Identifier_Content_nodeid = 'db05c421-ca7a-11e9-bd7a-a4d18cec433a';
                var DigitalResource_Identifier_Type_nodeid = 'db05c05e-ca7a-11e9-8824-a4d18cec433a';
                var URL_Concept_valueid = 'f32d0944-4229-4792-a33c-aadc2b181dc7';
                this.visualWorkIds = resourceUtils.getNodeValues({
                    widgetLabel: 'Shows Image.shows',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.visualWorkIds.forEach(function(resourceid) {
                    // look up related Visual Work
                    resourceUtils.lookupResourceInstanceData(resourceid)
                        .then(function(data) {
                            var used_image_resourceids = resourceUtils.getNodeValues({
                                nodeId: VisualWork_UsedImage_nodeid,
                                returnTiles: false
                            }, data._source.tiles);

                            // look up related Digital Resource
                            used_image_resourceids.forEach(function(resourceid) {
                                resourceUtils.lookupResourceInstanceData(resourceid)
                                    .then(function(data) {
                                        // console.log(data)
                                        var manifests = resourceUtils.getNodeValues({
                                            nodeId: DigitalResource_Identifier_Content_nodeid,
                                            where: {
                                                nodeId: DigitalResource_Identifier_Type_nodeid,
                                                contains: URL_Concept_valueid
                                            },
                                            returnTiles: false
                                        }, data._source.tiles);
                                        // console.log(manifests);
                                        getManifestData(manifests);
                                    });
                            });
                        });
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});
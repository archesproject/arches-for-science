define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'viewmodels/report',
    'bindings/chosen'
], function($, _, ko, koMapping, arches, ReportViewModel) {
    NODE_ID = "@node_id";
    TILE_ID = "@tile_id";
    VALUE = "@value";
    NON_DATA_COLLECTING_NODE = "NON_DATA_COLLECTING_NODE";

    TAB_DATA = [
        {
            title: "Names/Classification",
            sections: [
                {
                    nodeId: 'b9c1ced7-b497-11e9-a4da-a4d18cec433a',  /* assumes each section contains a single node */
                    sectionTitle: "Name(s) of Thing",
                    hasPlusSign: true,
                    childNodeData: [
                        { 
                            nodeId: 'b9c1d8a6-b497-11e9-876b-a4d18cec433a',
                            columnName: 'Name',
                            
                        },
                        { 
                            nodeId: 'b9c1d7ab-b497-11e9-9ab7-a4d18cec433a',
                            columnName: 'Name Type',
                        },
                        { 
                            nodeId:'b9c1d400-b497-11e9-90ea-a4d18cec433a', 
                            columnName: 'Language',
                        },
                    ],
                },
                {
                    nodeId: '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a',  /* assumes each section contains a single node */
                    sectionTitle: "Type of Object",
                },
                {
                    nodeId: '22c150ca-b498-11e9-9adc-a4d18cec433a',  /* assumes each section contains a single node */
                    sectionTitle: "Identifiers",
                    hasPlusSign: true,
                    childNodeData: [
                        { 
                            nodeId: '22c169b5-b498-11e9-bdad-a4d18cec433a',
                            columnName: 'Identifier',
                        },
                        { 
                            nodeId: '22c15cfa-b498-11e9-b5e3-a4d18cec433a',
                            columnName: 'Identifier Type',
                        },
                    ],
                }
            ],
        },
        {
            title: "Existence",
            sections: [],
        },
        {
            title: "Parameters",
            sections: [],
        },
        {
            title: "Parts",
            sections: [],
        },
        {
            title: "Temporal Relations",
            sections: [],
        },
        {
            title: "Location",
            sections: [],
        },
        {
            title: "Descriptions",
            sections: [],
        }
    ];

    var ThematicReportTab = function(tabData, hideEmptySections) {
        var self = this;

        this.hideEmptySections = hideEmptySections;  /* READ-ONLY on this level */

        /* BEGIN page layout source-of-truth */ 
        this.title = tabData.title;
        this.sections = ko.observableArray(tabData.sections);
        /* END page layout source-of-truth */ 

        this.isSectionEmpty = function(section) {
            return _.isEmpty(section.data) && !section.childNodeData.length;
        }

        // this.initialize = function() {

        //     tabDatum.sections.forEach(function(section) {
        //             var nodeData = self.getNodeDataFromDisambiguatedGraph(section.nodeId);

        //             console.log("AASIODFIOSF", data, section, nodeData)

        //             if (nodeData.length && section.childNodeData) {
        //                 mapChildNodeDataToSection(nodeData, section);
        //             }
        //             else {
        //                 section['childNodeData'] = [];
        //             }

        //             if (nodeData.length) {

        //             }
        //             else {
        //                 section['data'] = {};
        //             }
        //         });
        // };


        // this.initialize();
    };

    var viewModel = function(params) {
        var self = this;
        ReportViewModel.apply(this, [params]);

        this.disambiguatedResourceGraph = ko.observable();

        this.reportTabs = ko.observableArray();

        this.activeTabIndex = ko.observable(0);
        this.activeTab = ko.computed(function() {
            if (self.reportTabs().length) {
                return self.reportTabs()[self.activeTabIndex()];
            }
        });

        this.emptyReportSectionsHidden = ko.observable(false);

        this.initialize = function() {
            var url = arches.urls.api_resources(params.report.get('resourceid')) + '?format=json&compact=false';

            $.get(url, function(data) {
                self.disambiguatedResourceGraph(data);

                TAB_DATA.forEach(function(tabDatum) {
                    self.mapResourceDataToTabData(tabDatum)

                    self.reportTabs.push(
                        new ThematicReportTab(
                            tabDatum,
                            self.emptyReportSectionsHidden
                        )
                    );
                });
            });
        };

        this.mapResourceDataToTabData = function(tabData) {
            var disambiguatedResourceData = self.disambiguatedResourceGraph().resource;

            var mapChildNodeDataToSection = function(nodeData, section) {
                section.childNodeData.forEach(function(childNodeDatum) {
                    childNodeDatum['data'] = Object.values(nodeData).find(function(nodeDatum) {
                        return _.isObject(nodeDatum) && nodeDatum[NODE_ID] === childNodeDatum.nodeId
                    });
                });
            };

            tabData.sections.forEach(function(section) {
                var resourceInstanceData = Object.values(disambiguatedResourceData).find(function(topLevelData) {
                    if (topLevelData instanceof Array) {
                        return topLevelData[0][NODE_ID] === section.nodeId;  /* all data has same nodeId */
                    }
                    return topLevelData[NODE_ID] === section.nodeId;
                });

                if (!(resourceInstanceData instanceof Array)) {
                    resourceInstanceData = [ resourceInstanceData ];
                }

                var topLevelData = [];

                if (resourceInstanceData.length) {
                    resourceInstanceData.forEach(function(resourceInstanceDatum) {
                        topLevelData.push(
                            {
                                [NODE_ID]: resourceInstanceDatum[NODE_ID],
                                [TILE_ID]: resourceInstanceDatum[TILE_ID],
                                [VALUE]: resourceInstanceDatum[VALUE],
                            }
                        )
                    });
                }

                section['data'] = topLevelData;
                

                console.log('sdfdsf', section)

                if (resourceInstanceData.length && section.childNodeData) {
                    mapChildNodeDataToSection(resourceInstanceData, section);
                }
                else {
                    section['childNodeData'] = [];
                }
            });
        };

        this.toggleEmptyReportSections = function() {
            self.emptyReportSectionsHidden(!self.emptyReportSectionsHidden());
        };

        this.initialize();
    };

    ko.components.register('thematic-report', {
        viewModel: viewModel,
        template: { require: 'text!report-templates/thematic' }
    });
});

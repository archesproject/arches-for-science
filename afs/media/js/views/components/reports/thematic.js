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
    TAB_DATA = [
        {
            title: "Names/Classification",
            sections: [
                {
                    sectionTitle: "Name(s) of Thing",
                    nodeId: 'b9c1ced7-b497-11e9-a4da-a4d18cec433a',  /* assumes each section contains a single node */
                    hiddenChildNodeIds: [  /* displays all child nodes by default */
                        'b9c1d69e-b497-11e9-8408-a4d18cec433a',
                        'b9c1d570-b497-11e9-8315-a4d18cec433a',
                    ],
                },
                {
                    sectionTitle: "Type of Object",
                    nodeId: '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a',  /* assumes each section contains a single node */
                },
                {
                    sectionTitle: "Identifiers",
                    nodeId: '22c150ca-b498-11e9-9adc-a4d18cec433a',  /* assumes each section contains a single node */
                    displayedChildNodeIds: [  /* displays all child nodes by default */
                        '22c169b5-b498-11e9-bdad-a4d18cec433a',
                        '22c15cfa-b498-11e9-b5e3-a4d18cec433a',
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

    var ThematicReportTab = function(title, sections) {
        var self = this;

        /* BEGIN page layout source-of-truth */ 
        this.title = title;
        this.sections = ko.observableArray();
        /* END page layout source-of-truth */ 

        this.initialize = function() {
            sections.forEach(function(section) {
                var displayedChildNodeIds = section.displayedChildNodeIds || [];
                var hiddenChildNodeIds = section.hiddenChildNodeIds || [];
    
                self.sections.push({
                    title: section.sectionTitle,
                    data: Object.values(section.data).reduce(function(acc, datum) {
                        if (displayedChildNodeIds.length) {
                            if (datum[NODE_ID] && displayedChildNodeIds.includes(datum[NODE_ID])) {
                                acc.push(datum);
                            }
                        }
                        else if (hiddenChildNodeIds.length) {
                            if (datum[NODE_ID] && !hiddenChildNodeIds.includes(datum[NODE_ID])) {
                                acc.push(datum);
                            }
                        }
                        else {
                            acc.push(datum);
                        }
        
                        return acc;
                    }, [])
                });
            });
        };

        this.initialize();
    };

    var viewModel = function(params) {
        var self = this;
        ReportViewModel.apply(this, [params]);

        this.disambiguatedResourceGraph = ko.observable();

        this.reportTabs = ko.observableArray();

        this.activeTabIndex = ko.observable(0);
        this.activeTab = ko.observable(TAB_DATA[self.activeTabIndex()]);

        this.hideEmptyReportSections = ko.observable(false);
        
        this.initialize = function() {
            var url = arches.urls.api_resources(params.report.get('resourceid')) + '?format=json&compact=false&hide_empty_node=true';

            $.get(url, function(data) {
                self.disambiguatedResourceGraph(data);

                TAB_DATA.forEach(function(tabDatum) {
                    tabDatum.sections.forEach(function(section) {
                        section['data'] = self.getNodeDataFromDisambiguatedGraph(section.nodeId);
                    });

                    self.reportTabs.push(
                        new ThematicReportTab(tabDatum.title, tabDatum.sections)
                    );
                });
            });
        };

        this.getNodeDataFromDisambiguatedGraph = function(nodeId) {
            return Object.values(self.disambiguatedResourceGraph().resource).find(function(topLevelNode) {
                return topLevelNode[NODE_ID] === nodeId;
            });
        };

        this.initialize();
    };

    ko.components.register('thematic-report', {
        viewModel: viewModel,
        template: { require: 'text!report-templates/thematic' }
    });
});

define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('sampling-activity-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'temporal', 'title': 'Temporal Relations'},
                {'id': 'parameters', 'title': 'Parameters & Outcomes'},
                {'id': 'parthood', 'title': 'Parthood'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];

            self.annotationTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null)
            };
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.selectedAnnotationTileId = ko.observable(null);

            self.nameDataConfig = {
                exactMatch: undefined
            };
            self.documentationDataConfig = {
                label: undefined,
                subjectOf: undefined,
            };
            self.substanceDataConfig = {
                dimension: undefined,
                timespan: {path: 'timespan', key: 'dates of sampling activiy'}
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.visible = {parts: ko.observable(true)};
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of sampling activity'],
                    identifier: self.cards?.['identifier for sampling activity'],
                    type: self.cards?.['type of sampling activity']
                };
                self.descriptionCards = {
                    statement: self.cards?.['statement about sampling activity'],
                };
                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to sampling activity'],
                };
                self.substanceCards = {
                    timespan: self.cards?.['dates of sampling activity'],
                };

                console.log(self.resource())
                console.log(self.cards)


            };

            self.temporalData = ko.observable({
                sections: [
                    {
                        title: "Temporal Relations of Sampling Activity", 
                        data: [{
                            key: 'Sampling Activity Period', 
                            value: self.getRawNodeValue(self.resource(), 'during'), 
                            card: self.cards?.["temporal relations of sampling activity"],
                            type: 'resource'
                        },{
                            key: 'Occurs After Event', 
                            value: self.getRawNodeValue(self.resource(), 'starts after'), 
                            card: self.cards?.["occurs after event in sampling activity"],
                            type: 'resource'
                        },{
                            key: 'Occurs Before Event', 
                            value: self.getRawNodeValue(self.resource(), 'ends before'), 
                            card: self.cards?.["occurs before event in sampling activity"],
                            type: 'resource'
                        }]
                    }
                ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parthood', 
                            data: [{
                                key: 'parent project of sampling activity', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent project of sampling activity'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parameterData = ko.observable({
                sections:[
                    {
                        title: 'Sampling Info', 
                        data: [{
                            key: 'sampling activity technique', 
                            value: self.getRawNodeValue(self.resource(), 'technique'), 
                            card: self.cards?.['technique of sampling activity'],
                            type: 'resource'
                        },{
                            key: 'sampling procedure', 
                            value: self.getRawNodeValue(self.resource(), 'used process'), 
                            card: self.cards?.['procedure used for sampling activity'],
                            type: 'resource'
                        },{
                            key: 'sampling activity tool type', 
                            value: self.getRawNodeValue(self.resource(), 'used object type'), 
                            card: self.cards?.['tool type used in sampling activity'],
                            type: 'resource'
                        },{
                            key: 'samplers', 
                            value: self.getRawNodeValue(self.resource(), 'carried out by'), 
                            card: self.cards?.['samplers'],
                            type: 'resource'
                        }]
                    }
                ]
            });

            const parts = self.getRawNodeValue(self.resource(), 'sampling unit')
            self.annotation = parts ? {
                info: parts.map((x => {
                    const overallObjectSampled = self.getRawNodeValue(x, 'sampling area', 'overall object sampled');
                    const samplingArea = self.getRawNodeValue(x, 'sampling area');
                    const sampleCreated = self.getRawNodeValue(x, 'sample created');
                    const tileId = self.getTileId(x);
                    return {overallObjectSampled, samplingArea, sampleCreated, tileId}
                })),
                card: self.cards?.['Sampling Unit for Sampling Activity'],
                featureCollection: parts.reduce(((previous, current) => {
                    const geojson = self.getNodeValue(current, 'sampling area', 'sampling area identification', 'Sampling Area Visualization');
                    for (feature of geojson.features){
                        feature.properties.tileId = self.getTileId(current);
                        previous.features.push(feature);
                    }
                    return previous;
                }), {features: [], type: 'FeatureCollection'})
            }: {};
            console.log(self.annotation)
        },
        template: { require: 'text!templates/views/components/reports/sampling-activity.htm' }
    });
});

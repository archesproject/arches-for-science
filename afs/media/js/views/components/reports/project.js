define([
    'jquery',
    'underscore',
    'knockout',
    'templates/views/components/reports/project.htm',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, projectReportTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('project-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classification'},
                {id: 'substance', title: 'Project Timeline'},
                {id: 'parthood', title: 'Parent Project'},
                {id: 'components', title: 'Component Projects'},
                {id: 'description', title: 'Description'},
                {id: 'documentation', title: 'Documentation'},
                {id: 'json', title: 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined
            };
            self.documentationDataConfig = {
                label: undefined,
                subjectOf: 'influenced by',
            };
            self.substanceDataConfig = {
                dimension: undefined,
                timespan: {path: 'timespan', key: 'dates of project'}
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.summary = params.summary;

            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };

            self.identifierTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(2).fill(null)
            };

            self.collectionOfChildProjects = ko.observableArray();
            self.visible = {
                childProjects: ko.observable(true),
                names: ko.observable(true),
                identifiers: ko.observable(true),
                classifications: ko.observable(true),
                statements: ko.observable(true)
            };

            const resourceId = ko.unwrap(self.reportMetadata).resourceinstanceid;
            const loadRelatedResources = async() => {
                const result = await reportUtils.getRelatedResources(resourceId);
                const relatedResources = result?.related_resources;
                const relationships = result?.resource_relationships;

                const relatedProjects = relationships.filter(relationship => 
                    relationship?.resourceinstancefrom_graphid === relationship?.resourceinstanceto_graphid).map(
                        relatedProject => relatedProject.resourceinstanceidfrom);
                    
                self.collectionOfChildProjects(relatedResources.filter(relatedResource => 
                    relatedProjects.includes(relatedResource.resourceinstanceid)));

                self.collectionOfChildProjects().map(child => {
                    child.link = reportUtils.getResourceLink({resourceId: child.resourceinstanceid}),
                    child.displaydescription = reportUtils.stripTags(child.displaydescription)
                    return child
                });
            };

            loadRelatedResources();

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of project'],
                    identifier: self.cards?.['identifier for project'],
                    type: self.cards?.['scale of project']
                };
                self.descriptionCards = {
                    statement: self.cards?.['statement about project'],
                };
                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to project'],
                    subjectOf: self.cards?.['source reference work for project'],
                };
                self.substanceCards = {
                    timespan: self.cards?.['dates of project'],
                };
            };

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parent Project', 
                            data: [{
                                key: 'parent project', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent project'],
                                type: 'resource'
                            }]
                        }
                    ]
            });
            self.temporalData = ko.observable({
                sections: [
                    {
                        title: 'Temporal Relations of Project', 
                        data: [
                            /*{
                                key: 'Project Period', 
                                value: self.getRawNodeValue(self.resource(), 'during'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            },*/
                            {
                                key: 'Occurs After Event', 
                                value: self.getRawNodeValue(self.resource(), 'starts after'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            },{
                                key: 'Occurs Before Event', 
                                value: self.getRawNodeValue(self.resource(), 'ends before'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            }
                        ]
                    }
                ]
            });
            self.parameterData = ko.observable({
                sections: [
                    {
                        title: 'Project Team', 
                        data: [{
                            key: 'project team', 
                            value: self.getRawNodeValue(self.resource(), 'carried out by'), 
                            card: self.cards?.['project team'],
                            type: 'resource'
                        }]
                    },
                    {
                        title: 'Activity Type of Project', 
                        data: [{
                            key: 'activity type of project', 
                            value: self.getRawNodeValue(self.resource(), 'technique'), 
                            card: self.cards?.['activity type of project'],
                            type: 'resource'
                        }]
                    }
                ]
            });

            ////// Search Details section //////
            self.nameSummary = ko.observable();
            self.datesSummary = ko.observable();
            self.activityTypeSummary = ko.observable();
            self.parentProjectSummary = ko.observable();
            self.teamSummary = ko.observable();
            self.statementsSummary = ko.observable();
            self.identifierSummary = ko.observable();
            self.typeSummary = ko.observable();

            const nameData = self.resource()?.Name;
            if (nameData) {
                self.nameSummary(nameData.map(x => {
                    const type = self.getNodeValue(x, 'Name_type');
                    const content = self.getNodeValue(x, 'Name_content');
                    const language = self.getNodeValue(x, 'Name_language');
                    return { type, content, language }
                }));
            };
        
            const datesData = self.resource()?.timespan;
            if (datesData) {
                self.datesSummary([{
                    beginning_of_beginning: self.getNodeValue(datesData, 'TimeSpan_begin of the begin'),
                    end_of_beginning: self.getNodeValue(datesData, 'TimeSpan_end of the begin'),
                    beginning_of_end: self.getNodeValue(datesData, 'TimeSpan_begin of the end'),
                    end_of_end: self.getNodeValue(datesData, 'TimeSpan_end of the end'),
                }]);
            };

            const activityTypeData = self.resource()?.technique;
            if (activityTypeData) {
                self.activityTypeSummary([{
                    content: self.getNodeValue(activityTypeData)
                }]);
            };

            const parentProjectData = self.resource()?.['part of'];
            if (parentProjectData) {
                self.parentProjectSummary([{
                    content: self.getNodeValue(parentProjectData),
                    link: self.getResourceLink({resourceId: self.getNodeValue(parentProjectData, 'resourceId')})
                }]);
            }

            const teamData = self.resource()?.['carried out by'];
            if (teamData) {
                self.teamSummary(teamData['instance_details'].map(x => {
                    const content = self.getNodeValue(x);
                    const link = self.getResourceLink({resourceId: self.getNodeValue(x, 'resourceId')});
                    return { content, link }
                }));
            };

            const statmentData = self.resource()?.Statement;
            if (statmentData) {
                self.statementsSummary(statmentData.map(x => {
                    const type = self.getNodeValue(x, 'Statement_type');
                    const content = self.getNodeValue(x, 'Statement_content');
                    const language = self.getNodeValue(x, 'Statement_language');
                    return { type, content, language }
                }));
            };

            const identiferData = self.resource()?.Identifier;
            if (identiferData) {
                self.identifierSummary(identiferData.map(x => {
                    const type = self.getNodeValue(x, 'Identifier_type');
                    const content = self.getNodeValue(x, 'Identifier_content');
                    return { type, content }
                }));
            };
        },
        template: projectReportTemplate
    });
});

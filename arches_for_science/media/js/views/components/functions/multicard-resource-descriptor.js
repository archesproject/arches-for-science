define([
    'jquery',
    'underscore',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/list',
    'views/components/functions/primary-descriptors',
    'templates/views/components/functions/multicard-resource-descriptor.htm',
    'bindings/select2-query',
],
function($, _, arches, ko, koMapping, ListView, PrimaryDescriptorsView, multicardResourceDescriptor) {
    // Get the parent component we want to inherit from from the ko registry.
    let parentComponent;
    const setParentComponent = (found) => {
        parentComponent = found;
    }
    ko.components.defaultLoader.getConfig('views/components/functions/primary-descriptors', setParentComponent);

    return ko.components.register('views/components/functions/multicard-resource-descriptor', {
        viewModel: function(params) {
            var self = this;
            parentComponent.viewModel.apply(this, arguments);

            this.selectedNodes = {
                name: ko.observableArray(),
                description: ko.observableArray(),
                map_popup: ko.observableArray(),
            };

            this.groupedNodesForSelect2 = self.graph.cards.map(card => {
                return {
                    text: card.name,
                    children: self.graph.nodes.filter(
                        node => node.datatype === 'string' && node.nodegroup_id === card.nodegroup_id
                    ).map(node => {
                        return {
                            id: node.nodeid,
                            text: node.alias,
                        }
                    }),
                }
            });

            Object.entries(this.selectedNodes).forEach(
                ([observableName, observable]) => {
                    observable.subscribe(actions => {
                        actions.forEach(action => {
                            self.updateTemplate(action.value, action.status, observableName)
                        })
                    }, this, 'arrayChange')
                }
            );

            this.baseSelect2Config = {
                multiple: true,
                placeholder: arches.translations.selectPrimaryDescriptionIdentifierCard,
                data: {results: self.groupedNodesForSelect2},
            };

            this.updateTemplate = (nodeid, actionType, descriptorName) => {
                const templateObservable = params.config.descriptor_types[descriptorName].string_template;
                const priorValue = templateObservable();
                const nodeAlias = self.graph.nodes.find(n => n.nodeid === nodeid).alias;

                if (actionType === 'deleted') {
                    if (priorValue.startsWith(`<${nodeAlias}>`)) {
                        templateObservable(priorValue.replace(`<${nodeAlias}>`, ''));
                    } else {
                        templateObservable(priorValue.replace(` <${nodeAlias}>`, ''));
                    }
                } else {
                    if (priorValue === '') {
                        templateObservable(`<${nodeAlias}>`);
                    } else {
                        templateObservable(`${priorValue} <${nodeAlias}>`);
                    }
                }
            };
        },
        template: multicardResourceDescriptor,
    });
});

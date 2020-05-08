define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'views/list',
    'viewmodels/function',
    'bindings/chosen'],
function($, _, ko, koMapping, ListView, FunctionViewModel, chosen) {
    return ko.components.register('views/components/functions/file-to-iiif', {
        viewModel: function(params) {
            FunctionViewModel.apply(this, arguments);
            var nodegroups = {};
            this.cards = ko.observableArray();
            this.selectedNodegroup = params.config.selected_nodegroup;
            this.selectedNodegroup.subscribe(function(ng){
                console.log('selected nodegroup id:', ng);
            });

            this.graph.cards.forEach(function(card){
                var found = !!_.find(this.graph.nodegroups, function(nodegroup){
                    return nodegroup.parentnodegroup_id === card.nodegroup_id;
                }, this);
                if(!found && !(card.nodegroup_id in nodegroups)){
                    this.cards.push(card);
                    nodegroups[card.nodegroup_id] = true;
                }
            }, this);

            window.setTimeout(function(){$("select[data-bind^=chosen]").trigger("chosen:updated")}, 300);
        },
        template: {
            require: 'text!templates/views/components/functions/file-to-iiif.htm'
        }
    });
});

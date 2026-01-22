import $ from 'jquery';
import _ from 'underscore';
import ko from 'knockout';
import FunctionViewModel from 'viewmodels/function';
import fileToIiifTemplate from 'templates/views/components/functions/file-to-iiif.htm';
import 'bindings/chosen';

export default ko.components.register('views/components/functions/file-to-iiif', {
    viewModel: function(params) {
        FunctionViewModel.apply(this, arguments);
        var nodegroups = {};
        this.triggering_nodegroups = params.config.triggering_nodegroups;
        this.cards = ko.observableArray();
        this.graph.cards. forEach(function(card){
            this.cards.push(card);
            nodegroups[card.nodegroup_id] = true;
        }, this);

        window.setTimeout(function(){$("select[data-bind^=chosen]").trigger("chosen:updated");}, 300);
    },
    template: fileToIiifTemplate
});
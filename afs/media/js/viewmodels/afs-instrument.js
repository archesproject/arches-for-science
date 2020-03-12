define(['jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'bindings/plotly',
    'bindings/select2-query',
    'bindings/color-picker',
], function($, _, ko, colorPicker) {
    /**
    * A viewmodel used for generic AFS instrument files
    *
    * @constructor
    * @name AfsInstrumentViewModel
    *
    * @param  {string} params - a configuration object
    */
    var AfsInstrumentViewModel = function(params) {
        var self = this;
        this.params = params;
        this.fileType = 'text/plain';
        this.url = "";
        this.type = "";
        this.loading = ko.observable(true);
        this.commonData = params.state;
        this.fileViewer = params.fileViewer;
        this.filter = ko.observable('');
        this.displayContent = ko.unwrap(this.params.displayContent);
        var localStore = window.localStorage;

        var renderer = this.displayContent.renderer.id;

        var formatDefaults = {
            'title': localStore.getItem(renderer + 'title') || 'Sample Reflectance',
            'titlesize': localStore.getItem(renderer + 'titlesize') || 24, 
            'xaxislabel': localStore.getItem(renderer + 'xaxislabel') || "Energy",
            'xaxislabelsize': localStore.getItem(renderer + 'xaxislabelsize') || 18,
            'yaxislabel': localStore.getItem(renderer + 'yaxislabel') || "Count",
            'yaxislabelsize': localStore.getItem(renderer + 'yaxislabelsize') || 18,
        };

        if ('chartData' in params.state === false) {
            this.commonData.chartData = ko.observable();
            this.commonData.seriesData = ko.observableArray([]);
            this.commonData.seriesStyles = ko.observableArray([]);
        }
        if ('chartTitle' in params.state === false) {
            this.commonData.chartTitle = ko.observable(formatDefaults['title']);
            this.commonData.titleSize = ko.observable(formatDefaults['titlesize']);
            this.commonData.xAxisLabel = ko.observable(formatDefaults['xaxislabel']);
            this.commonData.xAxisLabelSize = ko.observable(formatDefaults['xaxislabelsize']);
            this.commonData.yAxisLabel = ko.observable(formatDefaults['yaxislabel']);
            this.commonData.yAxisLabelSize = ko.observable(formatDefaults['yaxislabelsize']);
        }

        this.parsedData = this.commonData.parsedData;
        this.chartData = this.commonData.chartData;
        this.chartTitle = this.commonData.chartTitle;
        this.titleSize = this.commonData.titleSize;
        this.xAxisLabel = this.commonData.xAxisLabel;
        this.xAxisLabelSize = this.commonData.xAxisLabelSize;
        this.yAxisLabel = this.commonData.yAxisLabel;
        this.yAxisLabelSize = this.commonData.yAxisLabelSize;
        this.seriesData = this.commonData.seriesData;
        this.selectedSeriesTile = ko.observable(null);
        this.seriesStyles = this.commonData.seriesStyles;
        this.selectedSeriesTile.subscribe(function(tile){
            if(tile) {
                var existing = self.seriesStyles().find(function(el){
                    return el["tileid"] === tile.tileid;
                });
                if (existing) { self.colorHolder(existing["color"]); }
            }
        });
        this.colorHolder = ko.observable();
        this.colorHolder.subscribe(function(val){
            var existing = null, updated = null;
            if (self.selectedSeriesTile()) {
                existing = self.seriesStyles().find(function(el){
                    return el["tileid"] === self.selectedSeriesTile().tileid;
                });
                if (existing && val) {
                    updated = existing;
                    updated["color"] = val;
                    self.seriesStyles.replace(existing, updated);
                }
            }
        });

        this.toggleSelected = function(tile) {
            var selectable = self.seriesData().filter(function(t){return t.tileid === tile.tileid}).length === 1;;
            if(!tile || tile == self.selectedSeriesTile()) {
                self.selectedSeriesTile(null);
            } else if (selectable || tile) {
                self.selectedSeriesTile(tile);
            }
        };

        var chartFormattingDetails = {
            'title': this.chartTitle,
            'titlesize': this.titleSize, 
            'xaxislabel': this.xAxisLabel,
            'xaxislabelsize': this.xAxisLabelSize,
            'yaxislabel': this.yAxisLabel,
            'yaxislabelsize': this.yAxisLabelSize
        };

        _.each(chartFormattingDetails, function(val, key) {
            val.subscribe(function(val){
                localStore.setItem(renderer + key, val);
            });
        });

        this.addData = function(tile) {
            var existing = self.seriesStyles().find(function(el){
                return el["tileid"] === tile.tileid;
            });
            if (!existing) {
                self.seriesStyles.push({
                    "tileid":tile.tileid,
                    "color": (Math.floor(Math.random()*16777215).toString(16))
                });
            }
            var fileInfo = this.fileViewer.getUrl(tile);
            this.getChartingData(tile.tileid, fileInfo.url, fileInfo.name);
            self.toggleSelected(tile);
        };

        this.removeData = function(tileid) {
            if (!self.selectedSeriesTile()) {
                self.selectedSeriesTile(null);
            } else if (self.selectedSeriesTile().tileid === tileid) {
                self.selectedSeriesTile(null);
            }
            var existing = self.seriesStyles().find(function(el){
                return el["tileid"] === tileid;
            });
            this.seriesData().forEach(function(series) {
                if (series.tileid === tileid) {
                    this.seriesData.remove(series);
                    if (existing) { self.seriesStyles.remove(existing); }
                }
            }, this);
        };

        this.isFiltered = function(t){
            return self.fileViewer.getUrl(t).name.toLowerCase().includes(self.filter().toLowerCase());
        };
            
        this.chartOptions = {
            axis: {
                x: {
                    tick: {
                        count: 4
                    }
                }
            },
            zoom: {
                enabled: true
            }
        };

    };

    return AfsInstrumentViewModel;
});

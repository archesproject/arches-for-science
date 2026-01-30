import arches from "arches";
import ko from "knockout";
import Cookies from "js-cookie";
import xyParser from "utils/xy-parser";
import AlertViewModel from "viewmodels/alert";
import { generateArchesURL } from "@/arches/utils/generate-arches-url.ts";
import importerConfigurationTemplate from "templates/views/components/plugins/importer-configuration.htm";
import "bootstrap";
import "bindings/select2-query";

const vm = function (params) {
    this.alert = params.alert;
    this.rendererConfigs = params.rendererConfigs || ko.observableArray();
    this.selectedConfiguration =
        params.selectedConfiguration || ko.observable();
    this.showConfigurationPanel = ko.observable();
    this.editConfigurationId = ko.observable(undefined);
    this.showImporterList = ko.observable(true);
    this.applyConfigurationVisible = ko.observable(false);
    this.configurationName = ko.observable();
    this.configurationDescription = ko.observable();
    this.headerConfig = ko.observable();
    this.footerConfig = ko.observable();
    this.headerDelimiter = ko.observable();
    this.footerDelimiter = ko.observable();
    this.delimiterCharacter = ko.observable();
    this.invalidDelimiter = ko.observable(false);
    this.includeDelimiter = ko.observable();
    this.headerFixedLines = ko.observable();
    this.dataDelimiterRadio = ko.observable();
    this.chartTitle = ko.observable();
    this.xAxisLabel = ko.observable();
    this.yAxisLabel = ko.observable();
    this.dataDelimiter = ko.observable();
    this.placeholder = arches.translations.selectTransformation;

    const transformations = xyParser.transformations().map((transform) => {
        return {
            text: transform,
            id: transform,
        };
    });

    this.xyTransformations = ko.observable(transformations);
    this.selectedTransformation = ko.observable();
    this.selectedTransformation.subscribe((val) => console.log(val));

    this.dataDelimiterRadio.subscribe((value) => {
        if (value != "other") {
            this.dataDelimiter(value);
        } else {
            this.dataDelimiter("");
        }
    });

    this.renderer = "e93b7b27-40d8-4141-996e-e59ff08742f3";

    this.cancelConfigEdit = () => {
        this.showConfigurationPanel(false);
        this.showImporterList(true);
    };

    this.dataDelimiter.subscribe((newDelimiter) => {
        try {
            const valueRegex =
                newDelimiter.length < 2
                    ? new RegExp(`[${newDelimiter}\\s]+`)
                    : new RegExp(`${newDelimiter}`);
            this.invalidDelimiter(false);
        } catch (e) {
            this.invalidDelimiter(true);
        }
    });

    this.saveConfigEdit = async () => {
        const configId = this.editConfigurationId() ?? "";

        if (this.headerConfig() !== "fixed") {
            this.headerFixedLines(undefined);
        }
        if (this.headerConfig() !== "delimited") {
            this.headerDelimiter(undefined); // blank out previous values; don't save them.
        }
        if (this.footerConfig() !== "delimited") {
            this.footerDelimiter(undefined); // blank out previous values; don't save them.
        }

        const newConfiguration = {
            name: this.configurationName(),
            description: this.configurationDescription(),
            headerDelimiter: this.headerDelimiter(),
            footerDelimiter: this.footerDelimiter(),
            includeDelimiter: this.includeDelimiter(),
            headerFixedLines: this.headerFixedLines(),
            delimiterCharacter: this.dataDelimiter(),
            transformation: this.selectedTransformation(),
            display: {
                chartTitle: this.chartTitle(),
                xAxisLabel: this.xAxisLabel(),
                yAxisLabel: this.yAxisLabel(),
            },
            rendererId: this.renderer,
        };

        const configSaveResponse = await fetch(
            generateArchesURL("renderer_config", { renderer_config_id: configId}),
            {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(newConfiguration),
                headers: {
                    "X-CSRFToken": Cookies.get("csrftoken"),
                },
            }
        );

        if (configSaveResponse.ok) {
            rendererConfigRefresh();
        }

        this.showConfigurationPanel(false);
        this.showImporterList(true);
    };

    const rendererConfigRefresh = async () => {
        const rendererResponse = await fetch(`/renderer/${this.renderer}`);
        if (rendererResponse.ok) {
            const renderers = await rendererResponse.json();
            const configs = renderers?.configs;
            this.rendererConfigs(configs);

            // if (self.fileViewer.displayContent()) {
            //     const tile = self.fileViewer.displayContent().tile;
            //     const node = ko.unwrap(tile.data[self.fileViewer.fileListNodeId]);
            //     const configId = ko.unwrap(node[0].rendererConfig);
            //     if(configId){
            //         this.selectedConfig(configId);
            //     }
            // }
        } else {
            this.rendererConfigs([]);
        }
    };

    this.loadConfiguration = (configuration) => {
        this.configurationName(configuration.name);
        this.configurationDescription(configuration.description);
        const delimiterCharacter = configuration.config.delimiterCharacter;
        if (configuration.config?.headerFixedLines) {
            this.headerConfig("fixed");
            this.headerFixedLines(configuration.config.headerFixedLines);
        } else if (configuration.config?.headerDelimiter) {
            this.headerConfig("delimited");
            this.headerDelimiter(configuration.config.headerDelimiter);
        } else {
            this.headerConfig("none");
        }

        if (configuration.config?.footerDelimiter) {
            this.footerConfig("delimited");
            this.footerDelimiter(configuration.config.footerDelimiter);
        } else {
            this.footerConfig("none");
        }

        const radioValue = !delimiterCharacter
            ? ""
            : delimiterCharacter == "," || delimiterCharacter == "|"
                ? delimiterCharacter
                : "other";
        this.dataDelimiterRadio(radioValue);
        if (radioValue == "other") {
            this.dataDelimiter(delimiterCharacter);
        }
        this.editConfigurationId(configuration.configid);
        this.includeDelimiter(configuration?.config?.includeDelimiter);
        this.selectedTransformation(configuration?.config?.transformation);
        this.chartTitle(configuration?.config?.display?.chartTitle);
        this.xAxisLabel(configuration?.config?.display?.xAxisLabel);
        this.yAxisLabel(configuration?.config?.display?.yAxisLabel);
        this.showConfigurationPanel(true);
        this.showImporterList(false);
    };

    this.deleteConfiguration = async (configuration) => {
        const configDeleteResponse = await fetch(
            generateArchesURL("renderer_config", { renderer_config_id: configuration.configid}),
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "X-CSRFToken": Cookies.get("csrftoken"),
                },
            }
        );

        if (configDeleteResponse.ok) {
            const responseJson = await configDeleteResponse.json();
            if (responseJson.deleted) {
                rendererConfigRefresh();
            } else {
                this.alert(
                    new AlertViewModel(
                        "ep-alert-red",
                        arches.translations.importerInUse,
                        arches.translations.importerInUseWarning
                    )
                );
            }
        }
    };

    rendererConfigRefresh();
};

export default ko.components.register("importer-configuration", {
    viewModel: vm,
    template: importerConfigurationTemplate,
});
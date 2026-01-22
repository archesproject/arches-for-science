import $ from "jquery";
import _ from "underscore";
import ko from "knockout";
import Cookies from "js-cookie";
import uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import DragDrop from "@uppy/drag-drop";
import AwsS3 from "@uppy/aws-s3";
import ProgressBar from "@uppy/progress-bar";
import uppyDjangoStorages from "./uppy-django-storages";

/**
 * @constructor
 * @name dropzone
 */
ko.bindingHandlers.uppy = {
    init: function (
    element,
    valueAccessor,
    allBindings,
    viewModel,
    bindingContext
    ) {
    const innerBindingContext = bindingContext.extend(valueAccessor);
    ko.applyBindingsToDescendants(innerBindingContext, element);
    const options = valueAccessor() || {};

    const uppyObj = new uppy.Uppy({
        debug: true,
        autoProceed: true,
        onBeforeFileAdded: (currentFile) => {
        const name = currentFile.name
            .trim()
            .replaceAll(" ", "_")
            .replace(/(?=u)[^-\w.]/g, "");
        const modifiedFile = {
            ...currentFile,
            meta: {
            ...currentFile.meta,
            name,
            },
            name,
        };
        return modifiedFile;
        },
    })
        .use(DragDrop.default, {
        inline: options.inline,
        target: element,
        autoProceed: true,
        logger: uppy.debugLogger,
        })
        .use(uppyDjangoStorages.default, {
        beforeUpload: options.beforeUpload,
        })
        .use(AwsS3.default, {
        companionUrl: "/uppy",
        companionHeaders: {
            "X-CSRFToken": Cookies.get("csrftoken"),
        },
        shouldUseMultipart: (file) => file.size > 50 * 1000 ** 2,
        })
        .use(ProgressBar.default, {
        target: ".uppy-progress",
        });

    if (options.complete) {
        uppyObj.on("compete", options.complete);
    }

    if (options.error) {
        uppyObj.on("error", options.error);
    }

    return { controlsDescendantBindings: true };
    },
};
export default ko.bindingHandlers.uppy;
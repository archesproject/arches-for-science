define([
  "jquery",
  "underscore",
  "knockout",
  "js-cookie",
  "@uppy/core",
  "@uppy/dashboard",
  "@uppy/drag-drop",
  "@uppy/aws-s3",
  "@uppy/progress-bar",
  "./uppy-django-storages",
], function (
  $,
  _,
  ko,
  Cookies,
  uppy,
  Dashboard,
  DragDrop,
  AwsS3,
  ProgressBar,
  uppyDjangoStorages
) {
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
  return ko.bindingHandlers.dropzone;
});

define([
  "underscore",
  "knockout",
  "uuid",
  "arches",
  "models/tile",
  "js-cookie",
  "templates/views/components/workflows/chemical-analysis-workflow/ca-upload-files-step.htm",
  "bindings/uppy",
], function (_, ko, uuid, arches, TileModel, Cookies, uploadFilesStepTemplate) {
  return ko.components.register("ca-upload-files-step", {
    viewModel: function (params) {
      var self = this;
      const physicalThingId =
        params.projectinfo["select-phys-thing-step"].savedData().physicalThing;
      const observationInfo =
        params.observationinfo["instrument-info"].savedData();

      const datasetFileNodeId = "7c486328-d380-11e9-b88e-a4d18cec433a";
      const physThingName =
        params.projectinfo["select-phys-thing-step"].savedData().physThingName;

      this.datasetId = undefined;
      this.defaultFormat = ko.observable();
      this.datasetName = ko.observable();
      this.calcDatasetName = ko.computed(function () {
        const basename = self.datasetName() || "Dataset";
        return `${basename} (${physThingName})`;
      });
      this.datasetNameTileId = "";
      this.files = ko.observableArray();
      this.newFiles = ko.observableArray();
      this.observationReferenceTileId = "";
      this.physicalthingReferenceTileId = "";
      this.uniqueId = uuid.generate();
      this.uniqueidClass = ko.computed(function () {
        return "unique_id_" + self.uniqueId;
      });
      this.uppyOptions = {
        inline: true,
        dragDropTarget: ".dropzone-photo-upload",
        fileInputTarget: ".fileinput-button." + this.uniqueidClass(),
        autoProceed: true,
        error: (err) => {
          console.log(
            "An error occurred uploading files.  Check your CORS configuration and credentials.",
            err
          );
          params.pageVm.alert(
            new params.form.AlertViewModel(
              "ep-alert-red",
              "Error saving the file to the dataset.  Check your CORS configuration and permissions."
            )
          );
          self.newFiles().map((file) => {
            self.deleteFile(file);
          });
        },
        beforeUpload: async (files) => {
          return Promise.all(files.map(async (file) => self.saveFiles(file)));
        },
      };

      this.loadingMessage = ko.observable();
      this.loading = ko.observable(false);

      this.deleteFile = async (file) => {
        const fileTile = ko.unwrap(file.tileId);
        if (fileTile) {
          self.loading(true);
          try {
            self.loadingMessage(`Deleting ${ko.unwrap(file.name)}...`);
            const formData = new window.FormData();
            formData.append("tileid", fileTile);

            const resp = await window.fetch(arches.urls.tile, {
              method: "DELETE",
              credentials: "include",
              body: JSON.stringify(Object.fromEntries(formData.entries())),
              headers: {
                "X-CSRFToken": Cookies.get("csrftoken"),
              },
            });

            // .json should not typically be awaited without "ok" checking - but 500 seems to return json body in some cases.
            const body = await resp.json();

            if (
              resp.status == 200 ||
              (resp.status == 500 && body?.exception === 'TileModel.ObjectDoesNotExist')
            ) {
              const datasetFiles = this.files();
              this.files(
                datasetFiles.filter(
                  (datasetFile) => ko.unwrap(datasetFile.tileId) != fileTile
                )
              );

              saveWorkflowState();
            }
          } finally {
            self.loading(false);
          }
        }
      };

      this.init = function () {
        this.physicalthingReferenceTileId =
          params.form.value()?.physicalthingReferenceTileId ?? "";
        this.observationReferenceTileId =
          params.form.value()?.observationReferenceTileId ?? "";
        this.datasetId = params.form.value()?.datasetId ?? "";
        this.datasetName(params.form.value()?.datasetName ?? "");
        this.defaultFormat(params.form.value()?.defaultFormat);
        this.datasetNameTileId = params.form.value()?.datasetNameTileId ?? "";
        (params.form.value()?.files ?? []).forEach(function (file) {
          self.files.push(file);
        });
      };

      this.init();

      this.uniqueidClass = ko.pureComputed(function () {
        return "unique_id_" + self.uniqueId;
      });

      params.form.reset = this.reset = function () {
        self.datasetName(params.form.value()?.datasetName);
      };

      this.datasetName.subscribe(function (name) {
        params.form.dirty(
          name !== params.form?.savedData()?.datasetName &&
            self.files().length > 0
        );
      });
      this.files.subscribe(function () {
        params.form.dirty(false);
      });

      this.saveDatasetFile = (formData, file) => {
        //Tile structure for the Digital Resource 'File' nodegroup
        self.loading(true);

        if (file) {
          self.loadingMessage(arches.translations.buildingArches);
          let fileInfo;

          if (!ko.unwrap(file.tileId)) {
            fileInfo = {
              name: file.name,
              accepted: true,
              height: file.data.height,
              lastModified: file.data.lastModified,
              size: file.data.size,
              status: file.data.status,
              type: file.type,
              width: file.data.width,
              url: null,
              uploaded: ko.observable(false),
              // eslint-disable-next-line camelcase
              file_id: null,
              index: 0,
              content: null,
              clientFileId: file.id,
              error: file.error,
            };

            formData.append(
              `file-list_${datasetFileNodeId}_data`,
              JSON.stringify(fileInfo)
            );
            formData.append(
              `file-list_${datasetFileNodeId}_preloaded`,
              new Blob(),
              file.name
            );
          }
        }
      };

      params.form.save = () => {
        params.form.complete(false);
        if (self.files().length > 0) {
          this.saveFiles([]);
        }
        params.form.dirty(false);
        params.form.complete(true);
      };

      this.saveFiles = async (files) => {
        let datasetInfo = undefined;
        if (!Array.isArray(files)) {
          files = [files];
        }
        try {
          const formData = new window.FormData();
          formData.append("transaction_id", params.form.workflowId);
          formData.append("instrument_id", observationInfo.instrument.value);
          formData.append(
            "observation_id",
            observationInfo.observationInstanceId
          );
          if (self.observationReferenceTileId) {
            formData.append(
              "observation_ref_tile",
              self.observationReferenceTileId
            );
          }

          // For each part of parent phys thing, create a digital resource with a Name tile
          formData.append(
            "dataset",
            JSON.stringify({
              name: self.calcDatasetName(),
              tileId: self.datasetNameTileId,
              resourceInstanceId: self.datasetId,
              partResourceId: physicalThingId,
              defaultFormat: ko.unwrap(self.defaultFormat),
            })
          );

          self.loading(true);
          self.loadingMessage(`Saving dataset ${self.calcDatasetName()}`);
          Array.from(files).forEach((file) => {
            // Then save a file tile to the digital resource for each associated file
            self.saveDatasetFile(formData, file);
          });

          const resp = await window.fetch(
            arches.urls.upload_dataset_select_dataset_files_step,
            {
              method: "POST",
              credentials: "include",
              body: formData,
              headers: {
                "X-CSRFToken": Cookies.get("csrftoken"),
              },
            }
          );

          self.loading(false);
          if (resp.ok) {
            datasetInfo = await resp.json();
            self.observationReferenceTileId =
              datasetInfo.observationReferenceTileId;
            this.datasetId = datasetInfo.datasetResourceId;
            const newDatasetFiles = self.files().filter(
              (x) =>
                datasetInfo.removedFiles.find((y) => {
                  return ko.unwrap(x.tileId) == ko.unwrap(y.tileid);
                }) == undefined
            );
            self.newFiles(datasetInfo.files);
            self.files([...newDatasetFiles, ...datasetInfo.files]);
            self.datasetNameTileId = datasetInfo.datasetNameTileId;
          } else {
            throw ("Error saving uploaded files", resp); // rethrow with easier to understand message.
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log("Tile update failed", err);
          params.form.loading(false);
        }

        saveWorkflowState();
        self.snapshot = params.form.savedData();
        params.form.complete(true);
        return datasetInfo.files;
      };

      const saveWorkflowState = async () => {
        try {
          const dataToSave = {
            physicalthingReferenceTileId: self.physicalthingReferenceTileId,
            observationReferenceTileId: self.observationReferenceTileId,
            datasetName: self.datasetName(),
            datasetNameTileId: self.datasetNameTileId,
            datasetId: self.datasetId,
            defaultFormat: self.defaultFormat(),
            files: self.files(),
          };

          params.form.savedData(dataToSave);
          params.form.value(dataToSave);
          params.form.complete(true);
          params.form.dirty(false);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log("Tile update failed", err);
          params.pageVm.alert(
            new params.form.AlertViewModel(
              "ep-alert-red",
              "Error saving the Dataset"
            )
          );
          params.form.loading(false);
          return;
        }
      };
    },
    template: uploadFilesStepTemplate,
  });
});

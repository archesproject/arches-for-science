define([
    'knockout',
    'dropzone',
    'uuid',
    'arches',
    'views/components/iiif-viewer',
    'bindings/dropzone'
], function (ko, Dropzone, uuid, arches, IIIFViewerViewmodel) {
    return ko.components.register('manifest-manager', {
        viewModel: function(params) {
            var self = this;

            this.unsupportedImageTypes = ['tif', 'tiff', 'vnd.adobe.photoshop'];

            this.imagesForUpload = ko.observableArray([]);
            this.canvasesForDeletion = ko.observableArray([]);
            this.metadataToAdd = ko.observableArray([]);
            this.metadataToRemove = ko.observableArray([]);
            this.metaDataLabel = ko.observable('')
            this.metaDataValues = ko.observable('')

            this.addCanvas = function(canvas) { //the function name needs to be better
                self.canvasesForDeletion.push(canvas);
                self.canvas(canvas.images[0].resource.service['@id'])
            };

            this.removeCanvas = function(canvas) { //the function name needs to be better
                self.canvasesForDeletion.remove(canvas);
                self.canvas(canvas.images[0].resource.service['@id'])
            };

            IIIFViewerViewmodel.apply(this, [params]);

            /*this.isManifestDirty = ko.computed(function(){
                var manifestData = self.manifestData()
                manifestName = self.getLabel(manifestData || {label: ''})
                manifestDescription = self.getDescription(manifestData)
                return ((self.manifestName() !== manifestName) ||
                        (self.manifestDescription() !== manifestDescription));
            });*/

            this.operation = ko.observable();

            this.uniqueId = uuid.generate();
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });

            this.formData = new FormData();

            this.addAllCanvases = function() {
                self.canvases().forEach(function(canvas){
                    if (self.canvasesForDeletion().indexOf(canvas) < 0) {
                        self.canvasesForDeletion.push(canvas);
                    }
                });
            };

            this.clearCanvasSelection = function() {
                self.canvasesForDeletion([]);
            };

            this.addFile = function(file){
                self.imagesForUpload.push(file);
                self.formData.append("files", file, file.name);
                self.submitForManifest();
            };

            this.removeFile = function(file){
                self.imagesForUpload.remove(file);
            };

            this.reset = function() {
                if (self.dropzone) {
                    self.dropzone.removeAllFiles(true);
                    self.imagesForUpload.removeAll();
                    self.canvasesForDeletion.removeAll();
                }
            };

            this.submitForManifest = function(){
                self.formData.append("manifest_title", ko.unwrap(self.manifestName));
                self.formData.append("manifest_description", ko.unwrap(self.manifestDescription));
                self.formData.append("selected_canvases", JSON.stringify(ko.unwrap(self.canvasesForDeletion)));
                self.formData.append("manifest", ko.unwrap(self.manifest));
                self.formData.append("canvas_label", ko.unwrap(self.canvasLabel)); //new label for canvas
                self.formData.append("canvas_id", ko.unwrap(self.canvas)); //canvas id for label change
                self.formData.append("metadata_label", ko.unwrap(self.metaDataLabel));
                self.formData.append("metadata_values", ko.unwrap(self.metaDataValues));
                $.ajax({
                    type: "POST",
                    url: arches.urls.manifest_manager,
                    data: self.formData,
                    cache: false,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        self.formData.delete('files');
                        self.manifestData(response.manifest);
                        self.reset();
                        console.log('Submitted');
                    },
                    error: function(response) {
                        self.formData.delete('files')
                        self.reset();
                        console.log("Failed");
                    }
                })
            };

            this.dropzoneOptions = {
                url: "/afs/uploadedfiles/",
                dictDefaultMessage: '',
                autoProcessQueue: false,
                uploadMultiple: true,
                autoQueue: false,
                clickable: ".fileinput-button." + this.uniqueidClass(),
                previewsContainer: '#hidden-dz-previews',
                init: function() {
                    self.dropzone = this;

                    this.on("addedfile", self.addFile);
    
                    this.on("error", function(file, error) {
                        file.error = error;
                        self.imagessForUpload.valueHasMutated();
                    });    
                }
            };
        },
        template: { require: 'text!templates/views/components/plugins/manifest-manager.htm' }
    })
});
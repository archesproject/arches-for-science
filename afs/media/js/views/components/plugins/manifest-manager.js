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

            this.addCanvas = function(canvas) { //the function name needs to be better
                self.canvasesForDeletion.push(canvas);
                self.canvas(canvas.images[0].resource.service['@id'])
            };

            /*this.selectCanvas = function(canvas) {
                self.canvas(canvas.images[0].resource.service['@id'])
            };*/

            this.removeCanvas = function(canvas) { //the function name needs to be better
                self.canvasesForDeletion.remove(canvas);
                self.canvas(canvas.images[0].resource.service['@id'])
            };

            IIIFViewerViewmodel.apply(this, [params]);

            this.canvas.subscribe(function(val){
                console.log(val)
            });
            this.title = ko.observable();
            this.description = ko.observable();
            this.operation = ko.observable();

            this.uniqueId = uuid.generate();
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });

            this.formData = new FormData();

            this.addFile = function(file){
                self.imagesForUpload.push(file);
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
                this.imagesForUpload().forEach(function(file) {
                    self.formData.append("files", file, file.name);
                });
                self.formData.append("manifest_title", ko.unwrap(self.title));
                self.formData.append("manifest_description", ko.unwrap(self.description));
                self.formData.append("selected_canvases", JSON.stringify(ko.unwrap(self.canvasesForDeletion)));
                self.formData.append("manifest", ko.unwrap(self.manifest));
                self.formData.append("operation", "add");
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
                        self.manifest(response.url);
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
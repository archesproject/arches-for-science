define([
    'knockout',
    'dropzone',
    'uuid',
    'arches',
    'bindings/dropzone'
], function (ko, Dropzone, uuid, arches) {
    return ko.components.register('manifest-manager', {
        viewModel: function() {
            var self = this;

            this.imagessForUpload = ko.observableArray();
            this.unsupportedImageTypes = ['tif', 'tiff', 'vnd.adobe.photoshop'];

            this.title = ko.observable();
            this.description = ko.observable();

            this.uniqueId = uuid.generate();
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });

            this.formData = new FormData();

            /*this.filesJSON = ko.computed(function() {
                var imagessForUpload = self.imagessForUpload();
                return ko.toJS(imagessForUpload, function(file, i) {
                        return {
                            name: file.name,
                            accepted: file.accepted,
                            height: file.height,
                            lastModified: file.lastModified,
                            size: file.size,
                            status: file.status,
                            type: file.type,
                            width: file.width,
                            url: null,
                            file_id: null,
                            index: i,
                            content: URL.createObjectURL(file),
                            error: file.error
                        };
                    })
            }).extend({throttle: 100});*/

            this.addFile = function(file){
                self.imagessForUpload.push(file);
                self.formData.append("files", file, file.name);
            };

            this.reset = function() {
                if (self.dropzone) {
                    self.dropzone.removeAllFiles(true);
                    self.imagesForUpload.removeAll();
                }
            };

            this.submitForManifest = function(){
                self.formData.append("manifest_title", ko.unwrap(self.title));
                self.formData.append("manifest_description", ko.unwrap(self.description));
                $.ajax({
                    type: "POST",
                    url: arches.urls.manifest_manager,
                    data: self.formData,
                    cache: false,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        self.formData.delete('file')
                        console.log('submitted');
                    },
                    error: function(response) {
                        self.formData.delete('file')
                        console.log(response.responseText);
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
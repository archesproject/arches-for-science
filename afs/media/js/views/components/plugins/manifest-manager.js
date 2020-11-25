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

            this.filesForUpload = ko.observableArray();

            this.uniqueId = uuid.generate();
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });

            this.filesJSON = ko.computed(function() {
                var filesForUpload = self.filesForUpload();
                return ko.toJS(filesForUpload, function(file, i) {
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
            }).extend({throttle: 100});

            this.addFile = function(file){
                self.filesForUpload.push(file);
                $.ajax({
                    type: "POST",
                    url: arches.urls.manifest_manager,
                    data: self.fileJSON
                })
            };

            this.submitForManifest = function(){
                $.ajax({
                    type: "POST",
                    url: arches.urls.manifest_manager,
                    data: self.fileJSON
                })
            };

            this.removeAll = function(){
                self.filesForUpload.removeAll();
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
                        self.filesForUpload.valueHasMutated();
                    });    
                }
            };
        },
        template: { require: 'text!templates/views/components/plugins/manifest-manager.htm' }
    })
});
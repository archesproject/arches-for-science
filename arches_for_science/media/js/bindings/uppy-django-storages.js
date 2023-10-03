import BasePlugin from '@uppy/core/lib/BasePlugin.js';

export default class UppyDjangoStorages extends BasePlugin {
    constructor(uppy, opts) {
        super(uppy, opts);
        this.id = opts.id || 'UppyDjangoStorages';
        this.type = 'django';
    }

    install (){
        this.uppy.addPreProcessor(async (fileIds) => {
            const uppyFiles = fileIds.map(fileId => {
                return uppy.getFile(fileId)
            })
            const files = await this.opts.beforeUpload(uppyFiles);
            files.flat().map(file => {
                uppy.setFileState(file.clientId, {'name': file.path});
                uppy.setFileMeta(file.clientId, {'name': file.path})
            })
        });
    }
} 
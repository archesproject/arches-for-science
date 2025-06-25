define([], function() {
    const getVersion = (manifestData) => {
        const urlString = manifestData?.['@context'];
        const url = new URL(urlString);
        if (url.pathname.split("/")[3].startsWith("3")) {
            return 3;
        } else if (url.pathname.split("/")[3].startsWith("2")) {
            return 2;
        } else {
            throw new Error("Unable to identify version of IIIF presentation api.");
        }
    };
    const getManifestDataValue = function(object, property, returnFirstVal, version, i18n) {
        let val = object[property];
        if (version === 2) {
            if (Array.isArray(val) && returnFirstVal) val = val[0];
        } else if (version === 3) {
            if (i18n) val = val[i18n];
            if (Array.isArray(val) && returnFirstVal) val = val[0];
        }
        return val;
    };
    const getCanvases = (manifestData) => {
        const canvases = [];
        const version = getVersion(manifestData);
        if (version === 3) {
            const sequences = manifestData ? manifestData.items : [];
            sequences.forEach(function(canvas) {
                canvas.label = canvas.label["en"][0];
                canvas.id = getCanvasService(canvas);
                canvas.text = canvas.label;
                if (typeof canvas.thumbnail === 'object')
                    canvas.thumbnail = canvas.thumbnail[0]["id"];
                else if (canvas.items?.[0]?.items?.[0]?.body?.id)
                    canvas.thumbnail = canvas.items?.[0]?.items?.[0]?.body?.id;
                canvases.push(canvas);
            });
        } else if (version === 2) {
            const sequences = manifestData ? manifestData.sequences : [];
            sequences.forEach(function(sequence) {
                if (sequence.canvases) {
                    sequence.label = getManifestDataValue(sequence, 'label', true);
                    sequence.canvases.forEach(function(canvas) {
                        canvas.label = getManifestDataValue(canvas, 'label', true);
                        if (typeof canvas.thumbnail === 'object')
                            canvas.thumbnail = canvas.thumbnail["@id"];
                        else if (canvas.images && canvas.images[0] && canvas.images[0].resource)
                            canvas.thumbnail = canvas.images[0].resource["@id"];
                        canvas.id = getCanvasService(canvas);
                        canvas.text = canvas.label;
                        canvases.push(canvas);
                    });
                }
            });
        };
        return canvases;
    };
    const getCanvas = (manifestData, canvasId, updateCanvas) => {
        const version = getVersion(manifestData);
        if (version === 3) {
            if (manifestData.items.length > 0) {
                const canvases = manifestData.items;
                let canvasIndex = 0;
                if (!updateCanvas) {
                    canvasIndex = canvases.findIndex((c) => (getCanvasService(c) === canvasId));
                }
                return canvases[canvasIndex];
            }
        } else if (version === 2) {
            if (manifestData.sequences.length > 0) {
                const sequence = manifestData.sequences[0];
                let canvasIndex = 0;
                if (sequence.canvases.length > 0) {
                    if (!updateCanvas) {
                        canvasIndex = sequence.canvases.findIndex((c) => (getCanvasService(c) === canvasId));
                    }
                    return sequence.canvases[canvasIndex];
                }    
            }
        }
    };
    const getManifestThumbnail = (manifest) => {
        if (manifest.sequences) {
            const thumbnail = manifest.sequences[0].canvases[0].thumbnail;
            if (typeof thumbnail === 'object') {
                return thumbnail["@id"];
            }
            return thumbnail;
        } else {
            const thumbnail = manifest.items[0].thumbnail;
            if (typeof thumbnail === 'object') {
                return thumbnail[0].id;
            }
            return thumbnail;
        }
    };
    const getManifestLabel = (manifest) => {
        const label = manifest?.label;
        if (typeof label === 'object') {
            return manifest.label?.["en"]?.[0];
        } else {
            return label;
        }
    };
    const getManifestId = (manifest) => {
        return manifest?.['@id'] || manifest?.['id'];
    };
    const getCanvasLabel = (canvas) => {
        const label = canvas.label;
        if (typeof label === 'object') {
            return canvas.label?.["en"]?.[0];
        } else {
            return label;
        }
    };
    const getCanvasService = (canvas) => {
        if (canvas.images) {
            return canvas.images[0].resource.service['@id'];
        } else if (canvas.items) {
            return canvas.items[0].items[0].body[0].service[0]["@id"];
        };
    };
    const getMetadata = (manifestData) => {
        const version = getVersion(manifestData);
        if (version === 2) {
            return manifestData.metadata;
        } else if (version === 3) {
            return manifestData.metadata.map((data) => {
                const value = {};
                Object.entries(data).forEach(([k, v]) => {
                    value[k] = v['en'][0];
                });
                return value;
            });
        };
    };
    const getInitialCanvas = (manifestData) => {
        const version = getVersion(manifestData);
        if (version === 2) {
            return manifestData.sequences[0].canvases[0];
        } else if (version === 3) {
            return manifestData.items[0];
        }
    };



    return {
        getVersion,
        getManifestDataValue,
        getManifestLabel,
        getManifestId,
        getManifestThumbnail,
        getCanvases,
        getCanvas,
        getCanvasLabel,
        getCanvasService,
        getMetadata,
        getInitialCanvas,
    };
});

define([], function() {
    const getVersion = (manifestData) => {
        const urlString = manifestData?.['@context'];
        const url = new URL(urlString);
        if (url.pathname.split("/")[3].startsWith("3")) {
            return 3;
        } else if (url.pathname.split("/")[3].startsWith("2")) {
            return 2;
        }
    };
    const getManifestDataValue = function(object, property, returnFirstVal, version, i18n) {
        let val = object[property];
        if (version === 2) {
            if (Array.isArray(val) && returnFirstVal) val = val[0]
        } else if (version === 3) {
            if (i18n) val = val[i18n]
            if (Array.isArray(val) && returnFirstVal) val = val[0]
        }
        return val;
    };
    const getCanvases = (manifestData) => {
        const canvases = [];
        if (getVersion(manifestData) === 3) {
            const sequences = manifestData ? manifestData.items : [];
            sequences.forEach(function(canvas_item) {
                const canvas = {};
                canvas.items = canvas_item.items;
                canvas.label = canvas_item.label["en"][0];
                canvas.id = getCanvasService(canvas_item, 3);
                canvas.text = canvas.label;
                if (typeof canvas_item.thumbnail === 'object')
                    canvas.thumbnail = canvas_item.thumbnail[0]["id"];
                else if (canvas_item.items?.[0]?.items?.[0]?.body?.id)
                    canvas.thumbnail = canvas_item.items?.[0]?.items?.[0]?.body?.id;
                canvases.push(canvas);
            })
        } else if (getVersion(manifestData) === 2) {
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
                        canvas.id = getCanvasService(canvas, 2);
                        canvas.text = canvas.label;
                        canvases.push(canvas);
                    });
                }
            })
        };
        return canvases;
    };
    const getCanvas = (manifestData, canvasId, updateCanvas) => {
        if (getVersion(manifestData) === 3) {
            if (manifestData.items.length > 0) {
                const canvases = manifestData.items;
                let canvasIndex = 0;
                if (!updateCanvas) {
                    canvasIndex = canvases.findIndex((c) => (c.items[0].id === canvasId));
                }
                return canvases[canvasIndex];
            }
        } else if (getVersion(manifestData) === 2) {
            if (manifestData.sequences.length > 0) {
                const sequence = manifestData.sequences[0];
                let canvasIndex = 0;
                if (sequence.canvases.length > 0) {
                    if (!updateCanvas) {
                        canvasIndex = sequence.canvases.findIndex((c) => (c.images[0].resource.service['@id'] === canvasId));
                    }
                    return sequence.canvases[canvasIndex];
                }    
            }
        }
        return null;
    };
    const getCanvasLabel = (canvas, version) => {
        if (version === 2) {
            return canvas.label;
        } else if (version === 3) {
            return canvas.label?.["en"]?.[0];
        }
    };
    const getCanvasService = (canvas, version) => {
        if (version === 2) {
            return canvas.images?.[0]?.resource.service['@id'];
        } else if (version === 3) {
            return canvas.items[0].items[0].body[0].service[0]["@id"];
        };
    };
    const getMetadata = (manifestData) => {
        if (getVersion(manifestData) === 2) {
            return manifestData.metadata;
        } else if (getVersion(manifestData) === 3) {
            return manifestData.metadata.map((data) => {
                const value = {};
                Object.entries(data).forEach(([k, v]) => {
                    value[k] = v['en'][0];
                });
                return value;
            });
        };
    };
    // I need a better name for this function
    const changeCanvas = (manifestData) => {
        if (getVersion(manifestData) === 2) {
            return manifestData.sequences[0].canvases[0];
        } else if (getVersion(manifestData) === 3) {
            return manifestData.items[0];
        }
    };



    return {
        getVersion,
        getManifestDataValue,
        getCanvases,
        getCanvas,
        getCanvasLabel,
        getCanvasService,
        getMetadata,
        changeCanvas,
    };
});

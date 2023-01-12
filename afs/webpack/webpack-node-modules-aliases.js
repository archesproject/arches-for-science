module.exports = {
    PROJECT_NODE_MODULES_ALIASES: JSON.stringify({
        "plotly.js-dist": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/plotly.js-dist`)",
        "Plotly": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/plotly.js-dist`)",
        "three": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three`)",
        "CSS2DRenderer": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three/examples/jsm/renderers/CSS2DRenderer`)",
        "TrackballControls": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three/examples/jsm/controls/TrackballControls`)",
        "PDBLoader": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three/examples/jsm/loaders/PDBLoader`)",
        "PCDLoader": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three/examples/jsm/loaders/PCDLoader`)",
        "ColladaLoader": "Path.resolve(__dirname, `${APP_ROOT}/media/node_modules/three/examples/jsm/loaders/ColladaLoader`)",
    }),
};
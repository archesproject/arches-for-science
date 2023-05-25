define([], function() {

    const processRawNodeValue = (rawValue) => {
        if(typeof rawValue === 'string') {
            return rawValue;
        } else if(!rawValue) {
            return '--';
        }
        const nodeValue = rawValue?.['@display_value'] || rawValue?.['display_value'];
        const geojson = rawValue?.geojson;
        if(geojson){
            return geojson;
        }
        
        //strict checks here because some nodeValues (0, false, etc.) should be rendered differently.
        if(nodeValue !== undefined && nodeValue !== null && nodeValue !== ''){
            const regex = /<[^>]*>/g;
            return nodeValue.replace(regex, ""); // strip out HTML
        } else {
            return '--';
        }
    };

    const standardizeNode = (obj) => {
        if(obj){
            const keys = Object.keys(obj);
            keys.forEach(x => {
                obj[x.toLowerCase().trim()] = obj[x];
            });
        }
    };

    const getRawNodeValue = (resource, ...args) => {
        let rootNode = resource;
        let testPaths = undefined;

        if(typeof(args?.[0]) == 'object'){
            testPaths = args[0]?.testPaths;
        } else {
            testPaths = [args];
        }

        for(const path of testPaths){
            let node = rootNode;
            for(let i = 0; i < path.length; ++i){
                standardizeNode(node);
                const pathComponent = path[i];
                node = node?.[pathComponent];
            }
            if(node){
                return node;
            }
        }
    };

    const getNodeValue = (resource, ...args) => {
        const rawValue = getRawNodeValue(resource, ...args);
        return processRawNodeValue(rawValue);
    };

    return {
        getNodeValue: getNodeValue, // use this to get the "friendly" value of a node.  It uses both getRawNodeValue and processRawNodeValue
        getRawNodeValue: getRawNodeValue,
        processRawNodeValue: processRawNodeValue,
        standardizeNode: standardizeNode
    };
});

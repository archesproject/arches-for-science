define([
], function() {

    const average = (yValues) => {
        return yValues.reduce((total, num) => total + num, 0) / yValues.length;
    };

    const runTransformation = (yValues, transform) => {
        switch(transform) {
            case 'average':
                return average();
            default:
                return yValues[0];
        }
    };

    return {
        parse: (text, config) => {
            let values;
            const parsedData = {x: [], y: []};
            try {
                if(config?.headerDelimiter){
                    values = text.split(config?.headerDelimiter)[1].trim().split('\n');
                } else if (config?.headerFixedLines) {
                    const lines = text.split('\n');
                    values = lines.slice(config?.headerFixedLines);
                } else {
                    values = text.split('\n'); 
                }
            } catch(e) {
                values = text.split('\n');
            }
            const delimiterCharacter = config?.delimiterCharacter ?? ',';
            const valueRegex = new RegExp(`[ \t${delimiterCharacter}]+`);
            const transform = config?.transform ? config.transform : 'basic';
            values.forEach(function(val){
                const rec = val.trim().split(valueRegex);
                parsedData.x.push(parseFloat(rec[0]));
                const yValues = rec.slice(1).map(val => parseFloat(val));
                parsedData.y.push(runTransformation(yValues, transform));
            });
            return parsedData;
        }
    };
});

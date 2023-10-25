define([
], function() {

    const average = (yValues) => {
        return yValues.reduce((total, num) => total + num, 0) / yValues.length;
    };

    const runTransformation = (yValues, transform) => {
        switch(transform) {
            case 'mean':
                return average(yValues);
            default:
                return yValues[0];
        }
    };

    return {
        transformations: () => {
            return ["mean"]
        },
        parse: (text, config) => {
            let values;
            let workingText = text;
            const parsedData = {x: [], y: []};
            try {
                if(config?.footerDelimiter){
                    workingText = workingText.split(config?.footerDelimiter)[0].trim();
                }
                if(config?.headerDelimiter){
                    values = workingText.split(config?.headerDelimiter)[1].trim().split('\n');
                } else if (config?.headerFixedLines) {
                    const lines = workingText.split('\n');
                    values = lines.slice(config?.headerFixedLines);
                } else {
                    values = workingText.trim().split('\n'); 
                }
            } catch(e) {
                values = workingText.trim().split('\n');
            }
            const delimiterCharacter = config?.delimiterCharacter ?? ',';
            
            try {
                const valueRegex = (delimiterCharacter.length < 2) ? new RegExp(`[${delimiterCharacter}\\s]+`) : new RegExp(`${delimiterCharacter}`);
                const transform = config?.transformation ? config.transformation : 'basic';
                values.forEach(function(val){
                    const rec = val.trim().split(valueRegex).filter(element => element !== "");
                    parsedData.x.push(parseFloat(rec[0]));
                    const yValues = rec.slice(1).map(val => parseFloat(val));
                    parsedData.y.push(runTransformation(yValues, transform));
                });
                return parsedData;
            } catch (e) {
                if(e instanceof SyntaxError){
                    throw new Error("Invalid regular expression.  Delimiter Character in config must be a valid regular expression.")
                }
            }
        }
    };
});

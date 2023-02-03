define(['utils/load-component-dependencies'], function(loadComponentDependencies) {
    function removeTrailingCommaFromObject(string) {
        return string.replace(/,\s*}*$/, "}");
    }

    const afsFormatDataHTML = document.querySelector('#afsFormatData');
    const afsFormatData = afsFormatDataHTML.getAttribute('afsFormats');
    const fileRenderers = JSON.parse(removeTrailingCommaFromObject(afsFormatData));

    // loadComponentDependencies(Object.values(fileRenderers).map(value => value['component']));

    return fileRenderers;
});
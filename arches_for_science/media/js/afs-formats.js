define(['utils/load-component-dependencies'], function(loadComponentDependencies) {
    function removeTrailingCommaFromObject(string) {
        return string.replace(/,\s*}*$/, "}");
    }

    try {
        const afsFormatDataHTML = document.querySelector('#afsFormatData');
        const afsFormatData = afsFormatDataHTML.getAttribute('afsFormats');
        const fileRenderers = JSON.parse(removeTrailingCommaFromObject(afsFormatData));

        return fileRenderers;
    } catch (error) {
        console.error(error);
    }
});
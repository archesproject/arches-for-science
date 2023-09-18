define([], function() {
    function removeTrailingCommaFromObject(string) {
        return string.replace(/,\s*}*$/, "}");
    }

    try {
        const afsSettingsDataHTML = document.querySelector('#projectSettings');
        const cloudStorageText = afsSettingsDataHTML.getAttribute('cloudStorage');
        const cloudStorage = JSON.parse(removeTrailingCommaFromObject(cloudStorageText));

        return {
            cloudStorage
        };
    } catch (error) {
        console.error(error);
    }
});
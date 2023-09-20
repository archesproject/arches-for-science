define(['arches'], function(arches) {
    return {
        buildStrObject: function(str) {
            return {[arches.activeLanguage]: {
                "value": str || '',
                "direction": arches.languages.find(
                        lang => lang.code == arches.activeLanguage
                    ).default_direction,
            }};
        },
    };
});

import arches from 'arches';

export default {
    buildStrObject: function(str) {
        return {[arches.activeLanguage]: {
            "value": str || '',
            "direction": arches.languages.find(
                    lang => lang.code == arches.activeLanguage
                ).default_direction,
        }};
    },
};
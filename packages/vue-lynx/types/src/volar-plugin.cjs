const nativeTags = ['block', 'template', 'slot'];
module.exports = [
    // <= 1.8.27
    ({ vueCompilerOptions }) => {
        vueCompilerOptions.nativeTags = nativeTags;
        return { version: 1 };
    },
    // <= 2.0.13
    ({ vueCompilerOptions }) => {
        vueCompilerOptions.nativeTags = nativeTags;
        return { version: 2 };
    },
    // >= 2.0.14
    () => {
        return {
            version: 2,
            resolveTemplateCompilerOptions(options) {
                options.isNativeTag = tag => nativeTags.includes(tag);
                return options;
            },
        };
    },
];

// Meta-tags required by Vue template compilation
const metaTags = ['block', 'template', 'slot'];
// Lynx built-in elements — derived from @lynx-js/types IntrinsicElements.
// Run `pnpm generate:native-tags` to regenerate after upgrading @lynx-js/types.
const lynxTags = [
    'component',
    'filter-image',
    'image',
    'inline-image',
    'inline-text',
    'inline-truncation',
    'list',
    'list-item',
    'list-row',
    'page',
    'scroll-view',
    'text',
    'view',
    'raw-text',
    'input',
    'textarea',
    'frame',
    'overlay',
    'svg',
];
// Only meta-tags go into isNativeTag. Lynx elements stay in GlobalComponents so
// Volar uses our VueLynxProps types instead of falling back to HTML/SVG intrinsics.
const nativeTags = metaTags;

// Vue compiler NodeTypes (hardcoded to avoid requiring @vue/compiler-core at IDE time)
const ELEMENT_NODE = 1;
const DIRECTIVE_NODE = 7;

const UNSUPPORTED_MODIFIERS = ['capture', 'passive'];

function lynxModifierTransform(node, context) {
    if (node.type !== ELEMENT_NODE) return;
    for (const prop of node.props) {
        if (prop.type !== DIRECTIVE_NODE || prop.name !== 'on') continue;
        for (const modifier of prop.modifiers) {
            // modifiers is string[] in Vue <3.3, SimpleExpressionNode[] in Vue >=3.3
            const name = typeof modifier === 'string' ? modifier : modifier.content;
            if (!UNSUPPORTED_MODIFIERS.includes(name)) continue;
            const loc = (typeof modifier === 'object' && modifier.loc) ? modifier.loc : prop.loc;
            const err = new SyntaxError(
                `Lynx does not support the .${name} event modifier.`
            );
            err.code = 1001;
            err.loc = loc;
            context.onError(err);
        }
    }
}

const plugins = [
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
                options.nodeTransforms = [...(options.nodeTransforms ?? []), lynxModifierTransform];
                return options;
            },
        };
    },
];
// Expose the full Lynx element list for external tools (e.g. generate-native-tags).
plugins.lynxTags = lynxTags;
module.exports = plugins;

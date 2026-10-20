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
// Elements Lynx ships outside @lynx-js/types' IntrinsicElements; typed in elements/animax.ts.
const extraTags = ['animax-view'];

// Only meta-tags go into isNativeTag. Lynx elements stay in GlobalComponents so
// Volar uses our VueLynxProps types instead of falling back to HTML/SVG intrinsics.
const nativeTags = metaTags;

// Vue compiler NodeTypes (hardcoded to avoid requiring @vue/compiler-core at IDE time)
const ELEMENT_NODE = 1;
const DIRECTIVE_NODE = 7;

const UNSUPPORTED_MODIFIERS = ['capture', 'passive'];

// Mirrors plugin/src/compiler/main-thread-transform.ts so the IDE types
// `@tap.main-thread` and `:ref.main-thread` as the main-thread-* props the
// runtime reads, instead of as a plain onTap / ref binding.
const SIMPLE_EXPRESSION_NODE = 4;
const CAN_STRINGIFY = 3;

function modifierName(modifier) {
    return typeof modifier === 'string' ? modifier : modifier.content;
}

function toMainThreadBind(name, prop) {
    return {
        type: DIRECTIVE_NODE,
        name: 'bind',
        rawName: `:${name}`,
        exp: prop.exp,
        arg: { type: SIMPLE_EXPRESSION_NODE, content: name, isStatic: true, constType: CAN_STRINGIFY, loc: prop.loc },
        modifiers: [],
        loc: prop.loc,
    };
}

function mainThreadModifierTransform(node) {
    if (node.type !== ELEMENT_NODE) return;
    for (let i = 0; i < node.props.length; i++) {
        const prop = node.props[i];
        if (prop.type !== DIRECTIVE_NODE) continue;
        const mods = prop.modifiers.map(modifierName);
        if (!mods.includes('main-thread')) continue;
        const arg = prop.arg;
        const name = arg && arg.type === SIMPLE_EXPRESSION_NODE && arg.isStatic ? arg.content : null;
        if (prop.name === 'on' && name !== null) {
            const kind = mods.includes('catch') ? 'catch' : 'bind';
            node.props[i] = toMainThreadBind(`main-thread-${kind}${name}`, prop);
        } else if (prop.name === 'bind' && name === 'ref') {
            node.props[i] = toMainThreadBind('main-thread-ref', prop);
        }
    }
}

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
    // Vue Language Tools >= 2.0.14 (Feb 2024)
    () => {
        return {
            version: 2,
            resolveTemplateCompilerOptions(options) {
                options.isNativeTag = tag => nativeTags.includes(tag);
                options.nodeTransforms = [...(options.nodeTransforms ?? []), mainThreadModifierTransform, lynxModifierTransform];
                return options;
            },
        };
    },
];
// Expose the full Lynx element list for external tools (e.g. generate-native-tags).
plugins.lynxTags = [...lynxTags, ...extraTags];
module.exports = plugins;

/**
 * Per-scene preparation: compile every variant's inputs once (untimed).
 */

import { compile } from '@vue/compiler-dom';
import { compile as compileVapor } from '@vue/compiler-vapor';
import * as VueLynx from 'vue-lynx';
import * as VueLynxVapor from 'vue-lynx/vapor';

import {
  makeBlockPlan,
  makeBlockTplTemplate,
  makeInlinePlan,
  makeStaticTplTemplate,
  staticCoverage,
  toTemplate,
} from './scene.mjs';

export { VueLynx };

/** Compile a template string into a component, mirroring plugin options. */
export function compileComponent(template, data) {
  const { code } = compile(template, {
    mode: 'function',
    hoistStatic: false,
    cacheHandlers: false,
    whitespace: 'condense',
    isNativeTag: () => true,
  });
  // eslint-disable-next-line no-new-func
  const render = new Function('Vue', code)(VueLynx);
  return { setup: () => data, render };
}

/** Compile and evaluate a real Vapor template against vue-lynx/vapor. */
export function compileVaporComponent(template, data) {
  const { code } = compileVapor(template, {
    mode: 'module',
    prefixIdentifiers: true,
    isNativeTag: () => true,
    whitespace: 'condense',
    eventDelegation: false,
  });

  const imports = [];
  const body = code
    .replace(
      /import\s*\{([^}]*)\}\s*from\s*(['"])vue\2;?/g,
      (_statement, specifiers) => {
        imports.push(
          ...specifiers.split(',').map((specifier) => specifier.trim()).filter(Boolean),
        );
        return '';
      },
    )
    .replace('export function render', 'function render');
  const bindings = imports
    .map((specifier) => specifier.replace(/\s+as\s+/, ': '))
    .join(', ');

  // Compiler output is an ES module. Evaluate the same generated module body
  // with its `vue` import bound to the published pure-Vapor runtime surface.
  // eslint-disable-next-line no-new-func
  const render = new Function(
    'Vue',
    `const { ${bindings} } = Vue;\n${body}\nreturn render;`,
  )(VueLynxVapor);

  return VueLynxVapor.defineVaporComponent(() => render(data));
}

export function prepareScene(sceneEntry, sizeArg) {
  const { scene, makeData, name } = sceneEntry;
  const data = makeData(sizeArg);

  const template = toTemplate(scene);
  const component = compileComponent(template, data);
  const vaporComponent = compileVaporComponent(template, data);

  const staticTpl = makeStaticTplTemplate(scene);
  const staticComponent = compileComponent(staticTpl.template, data);

  const blockTpl = makeBlockTplTemplate(scene);
  const blockComponent = compileComponent(blockTpl.template, data);

  const blockPlan = makeBlockPlan(scene);
  const inlinePlan = makeInlinePlan(scene);

  return {
    name,
    scene,
    data,
    coverage: staticCoverage(scene),
    component,
    vaporComponent,
    staticTpl: { registry: staticTpl.registry, component: staticComponent },
    blockTpl: { registry: blockTpl.registry, component: blockComponent },
    blockPlan,
    inlinePlan,
  };
}

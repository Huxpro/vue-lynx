/**
 * Per-scene preparation: compile every variant's inputs once (untimed).
 */

import { compile } from '@vue/compiler-dom';
import * as VueLynx from 'vue-lynx';

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

export function prepareScene(sceneEntry, sizeArg) {
  const { scene, makeData, name } = sceneEntry;
  const data = makeData(sizeArg);

  const template = toTemplate(scene);
  const component = compileComponent(template, data);

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
    staticTpl: { registry: staticTpl.registry, component: staticComponent },
    blockTpl: { registry: blockTpl.registry, component: blockComponent },
    blockPlan,
    inlinePlan,
  };
}

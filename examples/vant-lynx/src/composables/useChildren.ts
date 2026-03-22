import {
  reactive,
  provide,
  getCurrentInstance,
  onUnmounted,
  inject,
  computed,
} from 'vue-lynx';

/**
 * Minimal port of @vant/use useChildren/useParent.
 * Parent calls useChildren(KEY) → provides link/unlink + value.
 * Child calls useParent(KEY) → gets parent ref + auto-computed index.
 */

// Use `any` for ComponentInternalInstance since vue-lynx doesn't export it
type Instance = any;

export type ParentProvide<T> = T & {
  link(child: Instance): void;
  unlink(child: Instance): void;
  children: Instance[];
};

export function useChildren<T>(key: symbol) {
  const internalChildren: Instance[] = reactive([]);

  const linkChildren = (value?: T) => {
    const link = (child: Instance) => {
      internalChildren.push(child);
    };
    const unlink = (child: Instance) => {
      const idx = internalChildren.indexOf(child);
      if (idx > -1) internalChildren.splice(idx, 1);
    };
    provide(key as any, {
      link,
      unlink,
      children: internalChildren,
      ...value,
    } as ParentProvide<T>);
  };

  return { children: internalChildren, linkChildren };
}

export function useParent<T>(key: symbol) {
  const parent = inject<ParentProvide<T> | null>(key as any, null);

  if (parent) {
    const instance = getCurrentInstance()!;
    const { link, unlink } = parent;

    link(instance);
    onUnmounted(() => unlink(instance));

    const index = computed(() => parent.children.indexOf(instance));

    return { parent, index };
  }

  return {
    parent: null as ParentProvide<T> | null,
    index: computed(() => -1),
  };
}

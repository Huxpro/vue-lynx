declare module '*.vue' {
  import type { Component } from 'vue-lynx';

  const component: Component;
  export default component;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue-lynx';
  const component: DefineComponent;
  export default component;
}

declare module '*.png' {
  const src: string;
  export default src;
}

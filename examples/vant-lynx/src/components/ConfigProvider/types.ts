import type { InjectionKey } from 'vue-lynx';

export type Numeric = string | number;

export type ConfigProviderTheme = 'light' | 'dark';
export type ConfigProviderThemeVarsScope = 'local' | 'global';

export type ConfigProviderProvide = {
  iconPrefix?: string;
};

export const CONFIG_PROVIDER_KEY: InjectionKey<ConfigProviderProvide> =
  Symbol('van-config-provider');

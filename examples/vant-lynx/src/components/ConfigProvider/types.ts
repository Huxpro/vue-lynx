import type { InjectionKey } from 'vue-lynx';

export type Numeric = string | number;

export type ConfigProviderTheme = 'light' | 'dark';
export type ConfigProviderThemeVarsScope = 'local' | 'global';

export type ConfigProviderProvide = {
  iconPrefix?: string;
};

export interface ConfigProviderProps {
  tag?: string;
  theme?: ConfigProviderTheme;
  zIndex?: number;
  themeVars?: Record<string, string | number>;
  themeVarsDark?: Record<string, string | number>;
  themeVarsLight?: Record<string, string | number>;
  themeVarsScope?: ConfigProviderThemeVarsScope;
  iconPrefix?: string;
}

export const CONFIG_PROVIDER_KEY: InjectionKey<ConfigProviderProvide> =
  Symbol('van-config-provider');

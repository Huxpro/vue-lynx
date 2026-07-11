// Ported from elk: app/composables/settings/ (drastically reduced).
// Elk persists a full settings schema to localStorage; here only the
// preferences that drive ported features live in reactive module state.
import { reactive } from 'vue-lynx';

export interface UserSettings {
  hideBoostsInTimeline: boolean;
  hideRepliesInTimeline: boolean;
  fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colorMode: 'light' | 'dark';
}

const settings = reactive<UserSettings>({
  hideBoostsInTimeline: false,
  hideRepliesInTimeline: false,
  fontSize: 'md',
  colorMode: 'light',
});

export function useUserSettings() {
  return settings;
}

export function getPreferences<K extends keyof UserSettings>(s: UserSettings, key: K): UserSettings[K] {
  return s[key];
}

export function togglePreference(key: 'hideBoostsInTimeline' | 'hideRepliesInTimeline') {
  settings[key] = !settings[key];
}

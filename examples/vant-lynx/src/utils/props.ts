import { PropType } from 'vue-lynx';

export const numericProp = [Number, String];

export const makeNumericProp = <T>(defaultVal: T) => ({
  type: numericProp,
  default: defaultVal,
});

export const makeStringProp = <T>(defaultVal: T) => ({
  type: String as PropType<T>,
  default: defaultVal,
});

export const makeRequiredProp = <T>(type: T) => ({
  type,
  required: true as const,
});

import { ref, watch } from 'vue-lynx';

import { getItem, setItem } from '../lib/storage';

export const MODELS = [
  { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5', icon: 'i-simple-icons-anthropic' },
  { label: 'Gemini 3 Flash', value: 'google/gemini-3-flash', icon: 'i-simple-icons-google' },
  { label: 'GPT-5 Nano', value: 'openai/gpt-5-nano', icon: 'i-simple-icons-openai' },
];

// The original persists the choice in a cookie; we use the storage shim.
const model = ref(getItem('ai-chat:model') || 'anthropic/claude-haiku-4.5');
watch(model, (value) => setItem('ai-chat:model', value));

export function useModels() {
  return { models: MODELS, model };
}

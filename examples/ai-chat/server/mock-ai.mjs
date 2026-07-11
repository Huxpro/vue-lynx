/**
 * Deterministic mock AI generations, mirroring the original template's
 * server tools (shared/utils/tools/{weather,chart}.ts) and its provider
 * web-search tool — same output shapes, but seeded by the prompt so
 * screenshots are reproducible.
 */

export const MODELS = [
  { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5', icon: 'anthropic' },
  { label: 'Gemini 3 Flash', value: 'google/gemini-3-flash', icon: 'google' },
  { label: 'GPT-5 Nano', value: 'openai/gpt-5-nano', icon: 'openai' },
];

// --- tiny seeded PRNG so "random" weather/chart data is stable per prompt ---
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const CONDITIONS = {
  'sunny': { text: 'Sunny', icon: 'i-lucide-sun' },
  'partly-cloudy': { text: 'Partly Cloudy', icon: 'i-lucide-cloud-sun' },
  'cloudy': { text: 'Cloudy', icon: 'i-lucide-cloud' },
  'rainy': { text: 'Rainy', icon: 'i-lucide-cloud-rain' },
  'foggy': { text: 'Foggy', icon: 'i-lucide-cloud-fog' },
};
const CONDITION_KEYS = Object.keys(CONDITIONS);

function weatherOutput(location, rand) {
  const temp = Math.floor(rand() * 35) + 5;
  const cond = () => CONDITIONS[CONDITION_KEYS[Math.floor(rand() * CONDITION_KEYS.length)]];
  return {
    location,
    temperature: Math.round(temp),
    temperatureHigh: Math.round(temp + rand() * 5 + 2),
    temperatureLow: Math.round(temp - rand() * 5 - 2),
    condition: cond(),
    humidity: Math.floor(rand() * 60) + 20,
    windSpeed: Math.floor(rand() * 25) + 5,
    dailyForecast: ['Today', 'Tomorrow', 'Thu', 'Fri', 'Sat'].map((day) => ({
      day,
      high: Math.round(temp + rand() * 8 - 2),
      low: Math.round(temp - rand() * 8 - 3),
      condition: cond(),
    })),
  };
}

function chartInput(rand) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  let a = 120 + rand() * 40;
  let b = 90 + rand() * 30;
  const data = months.map((month) => {
    a += rand() * 46 - 14;
    b += rand() * 38 - 12;
    return { month, revenue: Math.round(a), profit: Math.round(b) };
  });
  return {
    title: 'Sales Performance 2025',
    data,
    xKey: 'month',
    series: [
      { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
      { key: 'profit', name: 'Profit', color: '#10b981' },
    ],
    xLabel: 'Month',
    yLabel: 'USD (k)',
  };
}

function extractLocation(prompt) {
  const m = prompt.match(/weather (?:in|at|for) ([A-Za-zÀ-ÿ' -]+?)[?.!]?$/im);
  return m ? m[1].trim() : 'Bordeaux';
}

/**
 * Returns the generation script for a prompt: an array of steps
 * ({kind: 'reasoning'|'text'|'tool'|'source', ...}).
 */
export function mockResponseFor(prompt, model) {
  const p = prompt.toLowerCase();
  const rand = seeded(prompt);
  const modelName = MODELS.find((m) => m.value === model)?.label || 'the model';

  if (p.includes('weather')) {
    const location = extractLocation(prompt);
    const output = weatherOutput(location, rand);
    return [
      {
        kind: 'reasoning',
        text: `The user is asking about current weather conditions in ${location}. I should call the weather tool to fetch the forecast and then summarize the conditions in a helpful way.`,
      },
      { kind: 'tool', name: 'weather', input: { location }, output },
      {
        kind: 'text',
        text: `It's currently **${output.temperature}°C** and ${output.condition.text.toLowerCase()} in ${location}, with a high of ${output.temperatureHigh}° and a low of ${output.temperatureLow}°. Humidity sits at ${output.humidity}% with winds around ${output.windSpeed} km/h.\n\nThe next few days look ${output.dailyForecast[1].condition.text.toLowerCase()} — a great time to plan accordingly!`,
      },
    ];
  }

  if (p.includes('chart') || p.includes('sales data') || p.includes('graph')) {
    const input = chartInput(rand);
    return [
      {
        kind: 'reasoning',
        text: 'The user wants a data visualization. I will generate a line chart with two series — revenue and profit — across the year so trends are easy to compare.',
      },
      { kind: 'tool', name: 'chart', input: { title: input.title }, output: input },
      {
        kind: 'text',
        text: `Here's a line chart of the sales data. **Revenue** climbs steadily through the year while **profit** follows with a healthy margin — the gap between the two lines is operating cost.\n\nWant me to break it down by quarter instead?`,
      },
    ];
  }

  if (p.includes('search') || p.includes('latest') || p.includes('news')) {
    const query = prompt.replace(/[?.!]$/, '');
    return [
      {
        kind: 'reasoning',
        text: 'This asks about current information, so I should use the web search tool and cite sources.',
      },
      {
        kind: 'tool',
        name: 'web_search',
        input: { query },
        output: {
          sources: [
            { url: 'https://lynxjs.org/', title: 'Lynx: Unlock Native for More' },
            { url: 'https://vuejs.org/guide/introduction.html', title: 'Introduction — Vue.js' },
            { url: 'https://ui.nuxt.com/docs/getting-started', title: 'Nuxt UI Documentation' },
          ],
        },
      },
      {
        kind: 'text',
        text: `Based on a quick search: **Lynx** is a family of technologies empowering developers to write native, GPU-accelerated UIs from web-familiar code, and it pairs nicely with **Vue** through custom renderers. The Nuxt UI docs cover the component patterns this very app is modeled on.`,
      },
      { kind: 'source', url: 'https://lynxjs.org/', title: 'Lynx: Unlock Native for More' },
      { kind: 'source', url: 'https://vuejs.org/guide/introduction.html', title: 'Introduction — Vue.js' },
    ];
  }

  if (p.includes('composable')) {
    return [
      {
        kind: 'reasoning',
        text: 'The user wants to learn how to write a Vue composable. A concrete, minimal example with code will explain it best. I should show state encapsulation and return refs.',
      },
      {
        kind: 'text',
        text: `A **composable** is a function that uses Vue's Composition API to encapsulate and reuse stateful logic. Here's a minimal counter:\n\n\`\`\`ts\nimport { ref, computed } from 'vue'\n\nexport function useCounter(initial = 0) {\n  const count = ref(initial)\n  const double = computed(() => count.value * 2)\n\n  function increment(by = 1) {\n    count.value += by\n  }\n\n  return { count, double, increment }\n}\n\`\`\`\n\nKey conventions:\n\n- Name it \`useXxx\` so tooling and humans recognize it\n- Return **refs**, not raw values, so reactivity survives destructuring\n- Keep side effects inside \`onMounted\`/\`onUnmounted\` hooks\n\nUse it in any component:\n\n\`\`\`vue\n<script setup>\nconst { count, increment } = useCounter()\n</script>\n\`\`\``,
      },
    ];
  }

  if (p.includes('nuxt ui')) {
    return [
      {
        kind: 'reasoning',
        text: 'The user asks why they should use Nuxt UI. I should cover components, theming, accessibility and integration.',
      },
      {
        kind: 'text',
        text: `**Nuxt UI** is worth reaching for because:\n\n- **Complete component set** — 100+ accessible components built on Reka UI primitives, from buttons to dashboards and chat layouts (this app is modeled on its chat template!)\n- **Design tokens** — semantic colors like \`text-muted\` or \`bg-elevated\` that adapt to light and dark mode automatically\n- **Tailwind-native theming** — override any slot with utility classes via the \`ui\` prop\n- **First-class Nuxt integration** — auto-imports, SSR safety, and \`app.config.ts\` runtime theming\n\nIf you're building a Vue or Nuxt app and want polished UI without designing a system from scratch, it's one of the strongest options available.`,
      },
    ];
  }

  if (p.includes('unjs')) {
    return [
      {
        kind: 'text',
        text: `**UnJS** is an ecosystem of framework-agnostic JavaScript libraries that compose into full-stack tooling:\n\n- **h3** — minimal, composable HTTP server framework\n- **ofetch** — better \`fetch\` with smart defaults and interceptors\n- **nitro** — universal server toolkit that powers Nuxt deployment\n- **unstorage** — key-value storage abstraction with 20+ drivers\n- **unhead** — document head management\n\nEach package is small, typed, and usable standalone — Nuxt itself is largely assembled from UnJS building blocks.`,
      },
    ];
  }

  if (p.includes('vueuse')) {
    return [
      {
        kind: 'text',
        text: `**VueUse** deserves a place in nearly every Vue project:\n\n- **200+ composables** covering sensors, browser APIs, animation, and state\n- **Tree-shakeable** — you only ship what you import\n- **SSR-friendly** and TypeScript-first\n- Battle-tested primitives like \`useLocalStorage\`, \`useClipboard\`, \`useIntersectionObserver\`, and \`useDebounceFn\`\n\nIt saves you from re-implementing (and re-debugging) the same utilities in every app.`,
      },
    ];
  }

  if (p.includes('tailwind')) {
    return [
      {
        kind: 'text',
        text: `**Tailwind CSS best practices:**\n\n1. **Use semantic tokens** — map colors to design intent (\`bg-elevated\`, \`text-muted\`) instead of raw palette values scattered everywhere\n2. **Extract components, not classes** — repeated utility groups belong in a Vue component, not \`@apply\`\n3. **Order classes consistently** — layout → spacing → typography → color; a formatter like prettier-plugin-tailwindcss automates this\n4. **Lean on \`gap\`** for spacing between flex/grid children instead of margins\n5. **Design in constraints** — stick to the spacing/type scale; if you write \`mt-[13px]\` often, fix the scale\n\nSmall class lists that read like sentences are the goal.`,
      },
    ];
  }

  // default
  return [
    {
      kind: 'text',
      text: `I'm the **mock ${modelName}** powering this Vue Lynx example offline. You asked:\n\n> ${prompt.slice(0, 200)}\n\nTry one of the quick prompts — weather, charts, web search, or code — to see streaming markdown, reasoning, and tool calls in action. Set \`AI_GATEWAY_API_KEY\` on the example server to swap in real models.`,
    },
  ];
}

export function mockTitleFor(firstMessage) {
  const text = (firstMessage?.parts || [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .replace(/["':;#*`]/g, '')
    .trim();
  if (!text) return 'Untitled';
  const words = text.split(/\s+/);
  let title = '';
  for (const w of words) {
    if ((title + ' ' + w).trim().length > 30) break;
    title = (title + ' ' + w).trim();
  }
  return title || 'Untitled';
}

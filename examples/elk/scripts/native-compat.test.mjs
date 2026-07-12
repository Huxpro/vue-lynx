import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const caseAdapter = await import('../src/change-case.ts').catch(() => ({}));
const domExceptionCompat = await import('../src/dom-exception-compat.ts').catch(() => ({}));
const fetchCompat = await import('../src/fetch-compat.ts').catch(() => ({}));
const safeAreaCompat = await import('../src/safe-area.ts').catch(() => ({}));
const lynxConfig = (await import('../lynx.config.ts')).default;

test('ASCII case adapter preserves masto action and response key conversion', () => {
  const fixtures = [
    ['verifyCredentials', 'verify_credentials', 'verifyCredentials'],
    ['HTTPStatus', 'http_status', 'httpStatus'],
    ['v1', 'v1', 'v1'],
    ['statuses/fetch', 'statuses_fetch', 'statusesFetch'],
    ['display_name', 'display_name', 'displayName'],
    ['URLValue99Bottles', 'url_value99_bottles', 'urlValue99Bottles'],
  ];

  for (const [input, snake, camel] of fixtures) {
    assert.equal(caseAdapter.snakeCase?.(input), snake);
    assert.equal(caseAdapter.camelCase?.(input), camel);
  }
});

test('native WebSocket remains wrapper-scoped for the Rspeedy dev transport', () => {
  assert.equal(lynxConfig.source?.define?.WebSocket, undefined);
});

test('fetch compatibility prefers the native wrapper and falls back to the web global', () => {
  const nativeFetch = () => 'native';
  const webFetch = () => 'web';

  assert.equal(fetchCompat.resolveFetch?.(webFetch, nativeFetch), nativeFetch);
  assert.equal(fetchCompat.resolveFetch?.(webFetch, undefined), webFetch);
  assert.equal(fetchCompat.resolveFetch?.(undefined, undefined), undefined);
  assert.equal(lynxConfig.source?.define?.fetch, undefined);
});

test('DOMException compatibility preserves name, message and instanceof checks', () => {
  const target = {};
  domExceptionCompat.installDOMException?.(target);

  const error = new target.DOMException('Request timed out', 'TimeoutError');
  assert.equal(error.name, 'TimeoutError');
  assert.equal(error.message, 'Request timed out');
  assert.equal(error instanceof Error, true);
  assert.equal(error instanceof target.DOMException, true);
});

test('timeline error UI does not issue a second diagnostic request', async () => {
  const source = await readFile(
    new URL('../src/components/TimelinePaginator.vue', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /probeResult|bare fetch/);
});

test('Sparkling iOS global props produce validated top and bottom safe-area insets', () => {
  assert.deepEqual(
    safeAreaCompat.getSafeAreaInsetsFromGlobalProps?.({
      os: 'ios',
      topHeight: 59,
      bottomHeight: 34,
    }),
    { top: 59, bottom: 34 },
  );
  assert.deepEqual(
    safeAreaCompat.getSafeAreaInsetsFromGlobalProps?.({
      os: 'IOS',
      topHeight: '44',
      bottomHeight: '21.5',
    }),
    { top: 44, bottom: 21.5 },
  );
});

test('Sparkling-enabled Lynx Explorer safe-area aliases work without an os prop', () => {
  assert.deepEqual(
    safeAreaCompat.getSafeAreaInsetsFromGlobalProps?.({
      safeAreaTop: 59,
      safeAreaBottom: 34,
    }),
    { top: 59, bottom: 34 },
  );
  assert.deepEqual(
    safeAreaCompat.getSafeAreaInsetsFromGlobalProps?.({
      os: 'ios',
      topHeight: 47,
      bottomHeight: 20,
      safeAreaTop: 59,
      safeAreaBottom: 34,
    }),
    { top: 47, bottom: 20 },
  );
});

test('safe-area insets fall back to zero outside valid Sparkling iOS props', () => {
  const cases = [
    undefined,
    {},
    { os: 'android', topHeight: 48, bottomHeight: 24 },
    { os: 'ios', topHeight: -1, bottomHeight: Number.POSITIVE_INFINITY },
    { os: 'ios', topHeight: 'not-a-number', bottomHeight: null },
  ];

  for (const globalProps of cases) {
    assert.deepEqual(
      safeAreaCompat.getSafeAreaInsetsFromGlobalProps?.(globalProps),
      { top: 0, bottom: 0 },
    );
  }
});

test('the root layout applies both safe-area edges around content and navigation', async () => {
  const source = await readFile(
    new URL('../src/App.vue', import.meta.url),
    'utf8',
  );

  assert.match(source, /getSparklingSafeAreaInsets/);
  assert.match(source, /safeArea\.top/);
  assert.match(source, /safeArea\.bottom/);
  assert.match(source, /class="safe-area-spacer"/);
});

test('Elk fidelity uses the upstream system sans typography and compact body rhythm', async () => {
  const [theme, content, statusCard] = await Promise.all([
    readFile(new URL('../src/styles/theme.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/content.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/StatusCard.vue', import.meta.url), 'utf8'),
  ]);

  assert.match(theme, /font-family:\s*-apple-system/);
  assert.match(theme, /--ease-out-quart:/);
  assert.match(content, /\.content-p\s*\{[^}]*line-height:\s*20px/s);
  assert.match(statusCard, /:size="main \? 56 : 48"/);
});

test('guest headers expose Elk-style sign-in navigation without hiding page actions', async () => {
  const source = await readFile(
    new URL('../src/components/PageHeader.vue', import.meta.url),
    'utf8',
  );

  assert.match(source, /currentUser/);
  assert.match(source, /router\.push\('\/settings'\)/);
  assert.match(source, /page-header-sign-in/);
  assert.match(source, /<slot\s*\/>[\s\S]*Sign in/);
});

test('status actions and bottom navigation acknowledge native touch input', async () => {
  const [actions, nav] = await Promise.all([
    readFile(new URL('../src/components/StatusActionsBar.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/NavBottom.vue', import.meta.url), 'utf8'),
  ]);

  for (const source of [actions, nav]) {
    assert.match(source, /@touchstart/);
    assert.match(source, /@touchend/);
    assert.match(source, /@touchcancel/);
    assert.match(source, /transition:\s*transform/);
  }
  assert.match(actions, /min-height:\s*40px/);
  assert.doesNotMatch(actions, /padding-right:\s*40px/);
});

test('tabs animate persistent indicators and Explore explains trending content', async () => {
  const [explore, account] = await Promise.all([
    readFile(new URL('../src/pages/ExplorePage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/AccountPage.vue', import.meta.url), 'utf8'),
  ]);

  assert.match(explore, /explore-intro/);
  assert.doesNotMatch(explore, /v-if="tab === '[^']+'" class="explore-tab-underline"/);
  assert.match(explore, /explore-tab-underline-active/);
  assert.doesNotMatch(account, /v-if="tab === t\.key" class="account-tab-underline"/);
  assert.match(account, /account-tab-underline-active/);
});

test('media preview motion mirrors Elk using only opacity and transform', async () => {
  const source = await readFile(
    new URL('../src/components/MediaPreview.vue', import.meta.url),
    'utf8',
  );

  assert.match(source, /<Transition name="media-preview">/);
  assert.match(source, /media-preview-enter-active/);
  assert.match(source, /transition:\s*opacity/);
  assert.match(source, /transform:\s*scale/);
  assert.doesNotMatch(source, /transition:\s*all/);
});

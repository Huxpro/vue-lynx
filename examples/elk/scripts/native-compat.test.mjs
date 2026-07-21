import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const caseAdapter = await import('../src/change-case.ts').catch(() => ({}));
const domExceptionCompat = await import('../src/dom-exception-compat.ts').catch(() => ({}));
const fetchCompat = await import('../src/fetch-compat.ts').catch(() => ({}));
const profileLoadCompat = await import('../src/composables/profile-load.ts').catch(() => ({}));
const safeAreaCompat = await import('../src/safe-area.ts').catch(() => ({}));
const sheetGesture = await import('../src/components/sheet/gesture.ts').catch(() => ({}));
const navItems = await import('../src/components/nav-items.ts').catch(() => ({}));
const lynxConfig = (await import('../lynx.config.ts')).default;

function isolateWorklet(worklet, captures = {}) {
  const names = Object.keys(captures);
  return Function(...names, `return (${worklet.toString()})`)(
    ...names.map(name => captures[name]),
  );
}

test('sheet claims handle drags vertically and content drags only downward at scroll top', () => {
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('handle', 2, -12, 40), true);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('handle', 20, 10, 0), false);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, 12, 0), true);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, -12, 0), false);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, 12, 1), false);
});

test('sheet uses bounded rubber resistance above the open position', () => {
  assert.equal(sheetGesture.resolveSheetDrag?.(30), 30);
  assert.ok(Math.abs(sheetGesture.resolveSheetDrag?.(-40, 80, 0.5) + 16) < 0.0001);
  assert.ok(sheetGesture.resolveSheetDrag?.(-10000, 80, 0.5) > -80);
});

test('sheet release uses distance or projected fling travel to dismiss', () => {
  assert.equal(sheetGesture.shouldDismissSheet?.(120, 0, 120), true);
  assert.equal(sheetGesture.shouldDismissSheet?.(119, 0, 120), false);
  assert.equal(sheetGesture.shouldDismissSheet?.(24, 900, 120), true);
  assert.equal(sheetGesture.shouldDismissSheet?.(10, 1200, 120), false);
  assert.equal(sheetGesture.shouldDismissSheet?.(60, -900, 120), false);
});

test('sheet dismiss threshold scales with native layout units', () => {
  assert.equal(sheetGesture.sheetDismissThreshold(1600), 240);
  assert.equal(sheetGesture.sheetDismissThreshold(1600, 180), 180);
  assert.equal(sheetGesture.sheetDismissThreshold(0), 120);
});

test('sheet backdrop progress follows downward travel', () => {
  assert.equal(sheetGesture.sheetOpenProgress?.(-20, 600), 1);
  assert.equal(sheetGesture.sheetOpenProgress?.(150, 600), 0.75);
  assert.equal(sheetGesture.sheetOpenProgress?.(800, 600), 0);
});

test('sheet filters noisy velocity samples and integrates a stable spring step', () => {
  assert.equal(sheetGesture.smoothSheetVelocity?.(0, 9, 10, 0.25), 225);
  assert.equal(sheetGesture.sheetReleaseVelocity?.(450, 40), 450);
  assert.equal(sheetGesture.sheetReleaseVelocity?.(450, 120), 0);
  const next = sheetGesture.stepSheetSpring?.(100, 0, 0, 1 / 60);
  assert.ok(next.value < 100);
  assert.ok(next.velocity < 0);
});

test('sheet worklets keep primitive defaults when detached from module scope', () => {
  const claim = isolateWorklet(sheetGesture.shouldClaimSheetGesture, {
    SHEET_GESTURE_LOCK_DISTANCE: sheetGesture.SHEET_GESTURE_LOCK_DISTANCE,
  });
  const resolveDrag = isolateWorklet(sheetGesture.resolveSheetDrag, {
    rubberEffect: sheetGesture.rubberEffect,
  });
  const project = isolateWorklet(sheetGesture.projectSheetRelease);
  const dismiss = isolateWorklet(sheetGesture.shouldDismissSheet, {
    projectSheetRelease: project,
  });

  assert.equal(claim('handle', 2, -12, 40), true);
  assert.equal(resolveDrag(30), 30);
  assert.equal(project(24, 900), 226.5);
  assert.equal(dismiss(24, 900, 120), true);
});

test('Vue Lynx Sheet keeps hybrid drag and settle work on the main thread', async () => {
  const source = await readFile(
    new URL('../src/components/sheet/Sheet.vue', import.meta.url),
    'utf8',
  );
  const theme = await readFile(
    new URL('../src/styles/theme.css', import.meta.url),
    'utf8',
  );

  assert.match(source, /modelValue/);
  assert.match(source, /v-show="modelValue"/);
  assert.doesNotMatch(source, /v-if="modelValue"/);
  assert.match(
    source,
    /<Transition[\s\S]*?name="sheet"[\s\S]*?persisted[\s\S]*?:duration="\{ enter: 250, leave: 188 \}"[\s\S]*?@before-enter="handleBeforeEnter"[\s\S]*?@after-leave="handleAfterLeave"/,
    'v-show sheet enter must be persisted with explicit durations and a before-enter snap',
  );
  assert.match(source, /class="sheet-backdrop"[^>]*:main-thread-ref="backdropRef"[^>]*@tap="requestClose"/s);
  assert.match(source, /class="sheet-surface"/);
  assert.match(
    source,
    /\.sheet-layer\s*\{[^}]*overflow:\s*hidden/s,
    'the sheet viewport must clip motion above the bottom nav and safe area',
  );
  assert.match(source, /:main-thread-ref="surfaceRef"/);
  assert.match(source, /:main-thread-bindlayoutchange="handleSurfaceLayout"/);
  assert.match(source, /class="sheet-handle"/);
  assert.match(source, /<scroll-view/);
  assert.match(source, /:main-thread-ref="panelRef"/);
  assert.match(
    source,
    /:bounces="true"/,
    'content keeps native bounce until the sheet claims a downward drag',
  );
  assert.match(source, /:main-thread-bindtouchstart="handleHandleTouchStart"/);
  assert.match(source, /:main-thread-bindtouchstart="handleContentTouchStart"/);
  assert.match(source, /:main-thread-bindtouchmove="handleTouchMove"/);
  assert.match(source, /:main-thread-bindtouchend="handleTouchEnd"/);
  assert.match(source, /scrollTopAtTouchStartRef\.current = scrollTopRef\.current/);
  assert.match(
    source,
    /shouldClaimSheetGesture\([\s\S]*?scrollTopAtTouchStartRef\.current,[\s\S]*?\)/,
  );
  assert.match(source, /setAttribute\?\.\('enable-scroll', enabled\)/);
  assert.match(source, /setPanelScrollEnabled\(false\)/);
  assert.match(source, /setPanelScrollEnabled\(true\)/);
  assert.match(
    source,
    /panelScrollEnabledRef\.current === enabled/,
    'avoid redundant enable-scroll attribute writes on every gesture reset',
  );
  assert.match(
    source,
    /backdropOpacityRef/,
    'quantize backdrop opacity writes during drag',
  );
  assert.match(
    source,
    /\.sheet-rubber-fill\s*\{[^}]*background-color:\s*var\(--c-sheet-fill-bg\)/s,
    'over-drag fill must stay opaque above the backdrop',
  );
  assert.match(theme, /--c-sheet-fill-bg:\s*#fafafa/);
  assert.match(theme, /\.app-dark\s*\{[^}]*--c-sheet-fill-bg:\s*#111111/s);
  assert.match(
    source,
    /setMotionTransition\(\s*`transform \$\{duration\}ms[^`]+`,\s*`opacity \$\{duration\}ms[^`]+`,\s*\)/s,
    'release settling must use native transform and opacity interpolation',
  );
  assert.match(
    source,
    /settleTimerRef\.current = setTimeout\(\(\) => \{[\s\S]*?applySheetMotion\(target\);/,
    'the transition must be committed before its target in a later frame',
  );
  assert.match(source, /setTimeout\(\(\) => finishSettle/);
  assert.doesNotMatch(
    source,
    /requestAnimationFrame\(step\)/,
    'a recursive worklet rAF loop can collapse into one native render batch',
  );
  assert.match(source, /animationGenerationRef/);
  assert.doesNotMatch(source, /watch\(\(\) => props\.modelValue/);
  assert.doesNotMatch(source, /prepareSheetForOpen/);
  assert.match(source, /function handleBeforeEnter\(\)[\s\S]*?runOnMainThread\(resetSheetMotion\)/);
  assert.match(
    source,
    /class="sheet-surface-transition"[^>]*:style="surfaceStyle"/,
    'transition motion must use a wrapper separate from gesture inline styles',
  );
  assert.doesNotMatch(
    source,
    /class="sheet-surface"[^>]*:style="surfaceStyle"/,
    'top inset must only be subtracted by the transition wrapper',
  );
  assert.match(source, /\.sheet-surface\s*\{[^}]*height:\s*100%/s);
  assert.match(
    source,
    /\.sheet-enter-from \.sheet-surface-transition,[\s\S]*?\.sheet-leave-to \.sheet-surface-transition\s*\{[^}]*transform:\s*translateY\(100%\)/s,
    'v-show enter and leave classes must move the dedicated transition wrapper',
  );
  assert.doesNotMatch(source, /\.sheet-enter-from \.sheet-surface,/);
  assert.match(source, /function resetSheetMotion\(\)[\s\S]*?applySheetMotion\(0\)/);
  assert.match(
    source,
    /function resetSheetMotion\(\)[\s\S]*?setMotionTransition\('none', 'none'\)[\s\S]*?applySheetMotion\(0\)/,
    'reset must leave gesture nodes with transition none, not revive stylesheet transitions',
  );
  assert.doesNotMatch(
    source,
    /function resetSheetMotion\(\)[\s\S]*?setMotionTransition\('', ''\)/,
  );
  assert.match(source, /runOnBackground\(requestClose\)/);
  assert.match(
    source,
    /\.sheet-enter-active,[\s\S]*?\.sheet-leave-active\s*\{[^}]*transition:\s*opacity/s,
    'opacity interpolation must live on enter/leave-active only',
  );
  assert.match(
    source,
    /\.sheet-enter-active \.sheet-surface-transition,[\s\S]*?\.sheet-leave-active \.sheet-surface-transition\s*\{[^}]*transition:\s*transform/s,
    'transform interpolation must live on enter/leave-active only',
  );
  assert.match(
    source,
    /\.sheet-enter-from,[\s\S]*?\.sheet-enter-from \.sheet-surface-transition\s*\{[^}]*transition:\s*none/s,
    'enter-from must snap closed instead of reverse-animating into the closed pose',
  );
  for (const [selector, label] of [
    ['.sheet-layer', 'layer'],
    ['.sheet-backdrop', 'backdrop'],
    ['.sheet-surface-transition', 'wrapper'],
    ['.sheet-surface', 'gesture surface'],
  ]) {
    const escaped = selector.replace(/\./g, '\\.');
    const block = source.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(block, `missing base ${label} rule`);
    assert.doesNotMatch(
      block[1],
      /\btransition\s*:/,
      `always-on ${label} transitions reverse-animate into enter-from on leave interrupt`,
    );
  }
  assert.doesNotMatch(source, /transition:\s*all/);
});

test('guest bottom navigation and More menu mirror upstream Elk', () => {
  const tabs = navItems.buildBottomTabs?.({ authenticated: false, server: 'mas.to' });
  assert.deepEqual(tabs?.map(item => item.label), [
    'Explore',
    'Local',
    'Federated',
    'More menu',
  ]);

  const menu = navItems.buildMoreMenuItems?.({
    authenticated: false,
    server: 'mas.to',
    activePath: '/mas.to/public',
  });
  assert.deepEqual(menu?.map(item => item.label), [
    'Search',
    'Home',
    'Notifications',
    'Conversations',
    'Favorites',
    'Bookmarks',
    'Compose',
    'Scheduled posts',
    'Explore',
    'Local',
    'Federated',
    'Lists',
    'Hashtags',
    'Settings',
  ]);

  const byKey = Object.fromEntries(menu?.map(item => [item.key, item]) ?? []);
  for (const key of ['home', 'notifications', 'conversations', 'favorites', 'bookmarks', 'compose', 'scheduled', 'lists', 'hashtags'])
    assert.equal(byKey[key]?.disabled, true, key);
  for (const key of ['search', 'explore', 'local', 'federated', 'settings'])
    assert.equal(byKey[key]?.disabled, false, key);
  assert.equal(byKey.federated?.active, true);
});

test('authenticated More menu enables implemented private routes', () => {
  const menu = navItems.buildMoreMenuItems?.({
    authenticated: true,
    server: 'mas.to',
    activePath: '/bookmarks',
  });
  const byKey = Object.fromEntries(menu?.map(item => [item.key, item]) ?? []);

  for (const key of ['home', 'notifications', 'favorites', 'bookmarks', 'compose'])
    assert.equal(byKey[key]?.disabled, false, key);
  assert.equal(byKey.bookmarks?.active, true);
  assert.equal(byKey.conversations?.disabled, true);
});

test('bottom navigation renders the Elk More sheet and persistent close tab', async () => {
  const source = await readFile(
    new URL('../src/components/NavBottom.vue', import.meta.url),
    'utf8',
  );

  assert.match(source, /import Sheet from '.\/sheet\/Sheet\.vue'/);
  assert.match(source, /buildBottomTabs/);
  assert.match(source, /buildMoreMenuItems/);
  assert.match(source, /<Sheet[^>]*v-model="sheetVisible"/s);
  assert.match(source, /sheetVisible \? 'close-line' : tab\.icon/);
  assert.match(source, /nav-sheet-item-disabled/);
  assert.match(source, /toggleTheme/);
  assert.match(source, /toggleZenMode/);
  assert.match(source, /sheetVisible\.value = false/);
});

test('sheet and bottom bar share one stable root across Transition removal', async () => {
  const [source, sheetSource] = await Promise.all([
    readFile(
      new URL('../src/components/NavBottom.vue', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/components/sheet/Sheet.vue', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(source, /<template>\s*<view class="nav-shell">[\s\S]*<Sheet[\s\S]*<view class="nav-bottom">[\s\S]*<\/view>\s*<\/view>\s*<\/template>/);
  assert.doesNotMatch(source, /position:\s*static/);
  assert.match(sheetSource, /\.sheet-layer\s*\{[^}]*position:\s*fixed/s);
});

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

test('fetch Link synthesis builds max_id next for status arrays when header missing', () => {
  const link = fetchCompat.synthesizeNextLink?.(
    'https://mas.to/api/v1/timelines/public?local=true&limit=30',
    JSON.stringify([{ id: '111' }, { id: '100' }]),
  );
  assert.match(link ?? '', /rel="next"/);
  assert.match(link ?? '', /max_id=100/);
  assert.match(link ?? '', /local=true/);
});

test('fetch Link synthesis uses offset when entities have no id', () => {
  const link = fetchCompat.synthesizeNextLink?.(
    'https://mas.to/api/v1/trends/tags?limit=10&offset=0',
    JSON.stringify([{ name: 'a' }, { name: 'b' }]),
  );
  assert.match(link ?? '', /offset=2/);
});

test('fetch Link synthesis stops when max_id would not advance', () => {
  const link = fetchCompat.synthesizeNextLink?.(
    'https://mas.to/api/v1/timelines/public?max_id=100',
    JSON.stringify([{ id: '100' }]),
  );
  assert.equal(link, null);
});

test('wrapFetchForMastoPagination synthesizes Link when native headers omit it', async () => {
  const wrapped = fetchCompat.wrapFetchForMastoPagination?.(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://mas.to/api/v1/timelines/public?limit=2',
    headers: { 'content-type': 'application/json' },
    async text() {
      return JSON.stringify([{ id: '2' }, { id: '1' }]);
    },
  }));
  assert.equal(typeof wrapped, 'function');
  const res = await wrapped('https://mas.to/api/v1/timelines/public?limit=2');
  assert.match(res.headers.get('link') ?? '', /max_id=1/);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  const body = JSON.parse(await res.text());
  assert.equal(body[1].id, '1');
});

test('wrapFetchForMastoPagination preserves an existing Link header', async () => {
  const existing = '<https://mas.to/api/v1/timelines/public?max_id=9>; rel="next"';
  const wrapped = fetchCompat.wrapFetchForMastoPagination?.(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get(name) {
        return name.toLowerCase() === 'link' ? existing : null;
      },
      forEach(fn) {
        fn(existing, 'link');
      },
    },
    async text() {
      return JSON.stringify([{ id: '2' }, { id: '1' }]);
    },
  }));
  const res = await wrapped('https://mas.to/api/v1/timelines/public?limit=2');
  assert.equal(res.headers.get('link'), existing);
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

test('account routes seed the profile cache from timeline data', async () => {
  const source = await readFile(
    new URL('../src/composables/routes.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /cacheAccount\(account\)/);
  assert.match(source, /return `\/\$\{currentServer\.value\}\/\@\$\{extractAccountHandle\(account\)\}`/);
});

test('failed profile requests are evicted so a later attempt can recover', async () => {
  let evictions = 0;

  await assert.rejects(
    profileLoadCompat.recoverProfileRequest?.(
      Promise.reject(new TypeError('fetch failed')),
      () => evictions++,
    ),
    /fetch failed/,
  );
  assert.equal(evictions, 1);
});

test('profile lookup retries transport failures but not missing accounts', async () => {
  let transientAttempts = 0;
  const account = await profileLoadCompat.retryProfileRequest?.(async () => {
    transientAttempts++;
    if (transientAttempts === 1)
      throw new TypeError('fetch failed');
    return { id: 'recovered-account' };
  });
  assert.equal(account?.id, 'recovered-account');
  assert.equal(transientAttempts, 2);

  let missingAttempts = 0;
  const missing = Object.assign(new Error('Record not found'), { statusCode: 404 });
  await assert.rejects(
    profileLoadCompat.retryProfileRequest?.(async () => {
      missingAttempts++;
      throw missing;
    }),
    /Record not found/,
  );
  assert.equal(missingAttempts, 1);
});

test('profile loads ignore stale results and expose an explicit retry action', async () => {
  const guard = profileLoadCompat.createProfileLoadGuard?.();
  const first = guard?.begin();
  const second = guard?.begin();
  assert.equal(guard?.isCurrent(first), false);
  assert.equal(guard?.isCurrent(second), true);

  const source = await readFile(
    new URL('../src/pages/AccountPage.vue', import.meta.url),
    'utf8',
  );
  assert.match(source, /class="account-retry"/);
  assert.match(source, /@tap="load"/);
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
  const [source, navSource] = await Promise.all([
    readFile(
      new URL('../src/App.vue', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/components/NavBottom.vue', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(source, /getSparklingSafeAreaInsets/);
  assert.match(source, /safeArea\.top/);
  assert.match(source, /safeArea\.bottom/);
  assert.match(source, /class="safe-area-spacer"/);
  assert.match(source, /<NavBottom\s+:safe-area-bottom="safeArea\.bottom"\s*\/>/);
  assert.match(navSource, /const sheetBottomInset = computed\(\(\) => 56 \+ props\.safeAreaBottom\)/);
  assert.match(navSource, /:bottom-inset="sheetBottomInset"/);
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

test('long feeds use recycling list scrolltolower instead of scroll-view', async () => {
  const [explore, account, search, timeline] = await Promise.all([
    readFile(new URL('../src/pages/ExplorePage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/AccountPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/SearchPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/TimelinePaginator.vue', import.meta.url), 'utf8'),
  ]);

  assert.match(timeline, /@scrolltolower="loadNext"/);
  assert.match(timeline, /lower-threshold-item-count/);
  assert.match(explore, /TimelinePaginator/);
  assert.match(explore, /@scrolltolower="loadMoreTags"/);
  assert.match(explore, /@scrolltolower="loadMoreLinks"/);
  assert.doesNotMatch(explore, /<scroll-view/);
  assert.match(account, /TimelinePaginator/);
  assert.doesNotMatch(account, /<scroll-view/);
  assert.match(search, /@scrolltolower="loadMore"/);
  assert.doesNotMatch(search, /<scroll-view/);
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

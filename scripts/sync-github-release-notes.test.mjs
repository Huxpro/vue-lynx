import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findPreviousReleaseTag,
  syncGeneratedReleaseNotes,
  tagNameForPackage,
} from './sync-github-release-notes.mjs';

test('tagNameForPackage matches Changesets package release tags', () => {
  assert.equal(
    tagNameForPackage({ name: 'vue-lynx', version: '0.4.0' }),
    'vue-lynx@0.4.0',
  );
  assert.equal(
    tagNameForPackage({ name: '@vue-lynx-example/basic', version: '0.2.5' }),
    '@vue-lynx-example/basic@0.2.5',
  );
});

test('findPreviousReleaseTag picks the previous release for the same package', () => {
  const releases = [
    { tag_name: '@vue-lynx-example/basic@0.2.5' },
    { tag_name: 'vue-lynx@0.4.0' },
    { tag_name: '@vue-lynx-example/slots@0.2.5' },
    { tag_name: '@vue-lynx-example/basic@0.2.4' },
    { tag_name: '@vue-lynx-example/basic@0.2.3' },
  ];

  assert.equal(
    findPreviousReleaseTag(
      releases,
      '@vue-lynx-example/basic',
      '@vue-lynx-example/basic@0.2.5',
    ),
    '@vue-lynx-example/basic@0.2.4',
  );
});

test('syncGeneratedReleaseNotes replaces release body with GitHub generated notes', async () => {
  const calls = [];
  const fetchImpl = (url, options = {}) => {
    calls.push({ url, options });

    if (url.endsWith('/releases?per_page=100&page=1')) {
      return jsonResponse([
        { tag_name: 'vue-lynx@0.4.0' },
        { tag_name: 'vue-lynx@0.3.1' },
      ]);
    }

    if (url.endsWith('/releases?per_page=100&page=2')) {
      return jsonResponse([]);
    }

    if (url.endsWith('/releases/tags/vue-lynx%400.4.0')) {
      return jsonResponse({ id: 123, tag_name: 'vue-lynx@0.4.0' });
    }

    if (url.endsWith('/releases/generate-notes')) {
      assert.deepEqual(JSON.parse(options.body), {
        tag_name: 'vue-lynx@0.4.0',
        previous_tag_name: 'vue-lynx@0.3.1',
      });
      return jsonResponse({
        name: 'vue-lynx@0.4.0',
        body: '## Minor Changes\n\n- feat: demo (#1) — @Huxpro',
      });
    }

    if (url.endsWith('/releases/123')) {
      assert.equal(options.method, 'PATCH');
      assert.deepEqual(JSON.parse(options.body), {
        body: '## Minor Changes\n\n- feat: demo (#1) — @Huxpro',
      });
      return jsonResponse({ id: 123 });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await syncGeneratedReleaseNotes({
    apiBaseUrl: 'https://api.github.test',
    fetchImpl,
    publishedPackagesJson: JSON.stringify([
      { name: 'vue-lynx', version: '0.4.0' },
    ]),
    repository: 'Huxpro/vue-lynx',
    token: 'token',
  });

  assert.deepEqual(result, [{ tagName: 'vue-lynx@0.4.0', releaseId: 123 }]);
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer token');
});

function jsonResponse(value) {
  return {
    ok: true,
    status: 200,
    json() {
      return value;
    },
    text() {
      return JSON.stringify(value);
    },
  };
}

#!/usr/bin/env node

const DEFAULT_API_BASE_URL = 'https://api.github.com';

export function tagNameForPackage(pkg) {
  return `${pkg.name}@${pkg.version}`;
}

export function findPreviousReleaseTag(releases, packageName, currentTagName) {
  const prefix = `${packageName}@`;

  return releases.find((release) => {
    const tagName = release.tag_name;
    return tagName !== currentTagName && tagName.startsWith(prefix);
  })?.tag_name;
}

export async function syncGeneratedReleaseNotes({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  fetchImpl = globalThis.fetch,
  publishedPackagesJson,
  repository,
  token,
}) {
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required.');
  }
  if (!token) {
    throw new Error('GITHUB_TOKEN is required.');
  }

  const packages = parsePublishedPackages(publishedPackagesJson);
  if (packages.length === 0) {
    console.info('No published packages found; skipping GitHub release notes sync.');
    return [];
  }

  const releases = await listReleases({ apiBaseUrl, fetchImpl, repository, token });
  const synced = [];

  for (const pkg of packages) {
    const tagName = tagNameForPackage(pkg);
    const release = await requestJson({
      apiBaseUrl,
      fetchImpl,
      method: 'GET',
      path: `/repos/${repository}/releases/tags/${encodeURIComponent(tagName)}`,
      token,
    });
    const previousTagName = findPreviousReleaseTag(releases, pkg.name, tagName);
    const notesBody = {
      tag_name: tagName,
      ...(previousTagName ? { previous_tag_name: previousTagName } : {}),
    };
    const generatedNotes = await requestJson({
      apiBaseUrl,
      body: notesBody,
      fetchImpl,
      method: 'POST',
      path: `/repos/${repository}/releases/generate-notes`,
      token,
    });

    await requestJson({
      apiBaseUrl,
      body: { body: generatedNotes.body },
      fetchImpl,
      method: 'PATCH',
      path: `/repos/${repository}/releases/${release.id}`,
      token,
    });

    console.info(`Updated GitHub release notes for ${tagName}.`);
    synced.push({ tagName, releaseId: release.id });
  }

  return synced;
}

function parsePublishedPackages(publishedPackagesJson) {
  if (!publishedPackagesJson) {
    return [];
  }

  const packages = JSON.parse(publishedPackagesJson);
  if (!Array.isArray(packages)) {
    throw new Error('PUBLISHED_PACKAGES must be a JSON array.');
  }

  return packages.filter((pkg) => pkg?.name && pkg?.version);
}

async function listReleases({ apiBaseUrl, fetchImpl, repository, token }) {
  const releases = [];

  for (let page = 1; ; page += 1) {
    const pageReleases = await requestJson({
      apiBaseUrl,
      fetchImpl,
      method: 'GET',
      path: `/repos/${repository}/releases?per_page=100&page=${page}`,
      token,
    });

    releases.push(...pageReleases);
    if (pageReleases.length < 100) {
      return releases;
    }
  }
}

async function requestJson({ apiBaseUrl, body, fetchImpl, method, path, token }) {
  const response = await fetchImpl(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API ${method} ${path} failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response.json();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await syncGeneratedReleaseNotes({
    apiBaseUrl: process.env.GITHUB_API_URL || DEFAULT_API_BASE_URL,
    publishedPackagesJson: process.env.PUBLISHED_PACKAGES,
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
  });
}

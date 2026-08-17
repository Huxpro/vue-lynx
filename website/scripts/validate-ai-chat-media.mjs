import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAX_GITHUB_FILE_SIZE = 100 * 1024 * 1024;

const media = [
  { path: 'examples/ai-chat/media/native-chat-ios26-master.mov', kind: 'video' },
  { path: 'examples/ai-chat/media/native-first-send.mp4', kind: 'video' },
  { path: 'examples/ai-chat/media/native-second-send.mp4', kind: 'video' },
  { path: 'examples/ai-chat/media/native-keyboard-follow.mp4', kind: 'video' },
  {
    path: 'website/docs/public/media/ai-chat/native-first-send.mp4',
    kind: 'video',
    web: true,
  },
  {
    path: 'website/docs/public/media/ai-chat/native-second-send.mp4',
    kind: 'video',
    web: true,
  },
  {
    path: 'website/docs/public/media/ai-chat/native-keyboard-follow.mp4',
    kind: 'video',
    web: true,
  },
  { path: 'website/docs/public/media/ai-chat/native-first-send.webp', kind: 'poster' },
  { path: 'website/docs/public/media/ai-chat/native-second-send.webp', kind: 'poster' },
  { path: 'website/docs/public/media/ai-chat/native-keyboard-follow.webp', kind: 'poster' },
];

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function probeVideo(file) {
  const output = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height,r_frame_rate',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      file,
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(output);
}

const failures = [];

for (const asset of media) {
  const file = path.join(REPO_ROOT, asset.path);
  if (!fs.existsSync(file)) {
    failures.push(`Missing media file: ${asset.path}`);
    continue;
  }

  const { size } = fs.statSync(file);
  if (size <= 0) {
    failures.push(`Empty media file: ${asset.path}`);
    continue;
  }
  if (size >= MAX_GITHUB_FILE_SIZE) {
    failures.push(`Media file exceeds GitHub's 100 MB limit: ${asset.path}`);
    continue;
  }

  if (asset.kind === 'poster') {
    console.info(`PASS ${asset.path} (${formatBytes(size)})`);
    continue;
  }

  try {
    const probe = probeVideo(file);
    const stream = probe.streams?.[0];
    const duration = Number(probe.format?.duration);
    const width = Number(stream?.width);
    const height = Number(stream?.height);

    if (stream?.codec_name !== 'h264') {
      failures.push(`Expected H.264 video: ${asset.path}`);
      continue;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      failures.push(`Expected positive video duration: ${asset.path}`);
      continue;
    }
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      failures.push(`Expected positive video dimensions: ${asset.path}`);
      continue;
    }
    if (asset.web && width > 720) {
      failures.push(`Web clip is wider than 720 px: ${asset.path}`);
      continue;
    }
    if (asset.web && (duration < 2 || duration > 12)) {
      failures.push(`Web clip must be between 2s and 12s: ${asset.path}`);
      continue;
    }

    console.info(
      `PASS ${asset.path} (${width}x${height}, ${duration.toFixed(2)}s, ${formatBytes(size)})`,
    );
  } catch (error) {
    failures.push(`Unable to probe ${asset.path}: ${error.message}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

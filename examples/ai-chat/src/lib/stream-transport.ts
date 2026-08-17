export type StreamTransport = 'sse' | 'poll';

export interface StreamEnvironment {
  nativeLynx: boolean;
  standardStreamingFetch?: boolean;
}

export function selectStreamTransport(env: StreamEnvironment): StreamTransport {
  return env.nativeLynx && !env.standardStreamingFetch ? 'poll' : 'sse';
}

export function currentStreamEnvironment(): StreamEnvironment {
  const runtime = globalThis as {
    SystemInfo?: { platform?: string };
    __LYNX_STANDARD_STREAMING_FETCH__?: boolean;
  };
  const platform = runtime.SystemInfo?.platform?.toLowerCase() ?? '';
  return {
    nativeLynx: Boolean(runtime.SystemInfo) && !platform.startsWith('web'),
    standardStreamingFetch: runtime.__LYNX_STANDARD_STREAMING_FETCH__ === true,
  };
}

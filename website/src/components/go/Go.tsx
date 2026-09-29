import { Go as GoBase, GoConfigProvider } from '@lynx-js/go-web';
import type { GoProps } from '@lynx-js/go-web';
import { rspressAdapter } from '@lynx-js/go-web/adapters/rspress';

const config = {
  exampleBasePath: '/examples',
  defaultTab: 'web' as const,
  ...rspressAdapter,
};

// What the QR code encodes. `?fullscreen=true` tells LynxExplorer to open the
// bundle edge-to-edge instead of inside its navigation chrome — every example
// here is a full-screen app, so that is the right default. Pages that need
// more (elk passes bar/bg colours) override it with their own `schema`.
const QRCODE_SCHEMA = '{{{url}}}?fullscreen=true';

export function Go(props: GoProps) {
  return (
    <GoConfigProvider config={config}>
      <GoBase schema={QRCODE_SCHEMA} {...props} />
    </GoConfigProvider>
  );
}

export type { GoProps };
export default Go;

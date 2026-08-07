import { Go as GoBase, GoConfigProvider } from '@lynx-js/go-web';
import type { GoProps } from '@lynx-js/go-web';
import { rspressAdapter } from '@lynx-js/go-web/adapters/rspress';

const config = {
  exampleBasePath: '/examples',
  defaultTab: 'web' as const,
  ...rspressAdapter,
};

export function Go(props: GoProps) {
  return (
    <GoConfigProvider config={config}>
      <GoBase {...props} />
    </GoConfigProvider>
  );
}

export type { GoProps };
export default Go;

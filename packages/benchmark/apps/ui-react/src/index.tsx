import { root } from '@lynx-js/react';

import { App } from './App';
import { nativeBenchmark } from '../../../shared/native-protocol';

const startup = nativeBenchmark.beginStartup();
root.render(<App />);
nativeBenchmark.finishStartup(startup);

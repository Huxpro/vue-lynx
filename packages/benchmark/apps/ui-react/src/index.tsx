import { root } from '@lynx-js/react';

import { App } from './App';
import {
  installElementTemplateCommitAckBridge,
  nativeBenchmark,
} from '../../../shared/native-protocol';

installElementTemplateCommitAckBridge();
const startup = nativeBenchmark.beginStartup();
root.render(<App />);
nativeBenchmark.finishStartup(startup);

// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/** Signal after every user entry module has completed its initial mount. */

import { completeIfrInitialRender } from './flush.js';

completeIfrInitialRender();

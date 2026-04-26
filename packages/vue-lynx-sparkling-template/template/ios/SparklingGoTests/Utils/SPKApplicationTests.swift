// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

@MainActor
struct SPKApplicationTests {
    @Test func testMainWindow_returnsUIWindowOrNil() {
        let window = SPKKitWrapper<UIApplication>.mainWindow
        #expect(window != nil)
    }
    
    @Test func testMainWindow_consistentResults() {
        let window1 = SPKKitWrapper<UIApplication>.mainWindow
        let window2 = SPKKitWrapper<UIApplication>.mainWindow
        #expect(window1 === window2)
    }
    
    @Test func testMainWindow_frameNotEmpty() {
        let window = SPKKitWrapper<UIApplication>.mainWindow
        if let window = window {
            #expect(window.frame.isEmpty == false)
            #expect(window.frame.width > 0)
            #expect(window.frame.height > 0)
        }
    }
}


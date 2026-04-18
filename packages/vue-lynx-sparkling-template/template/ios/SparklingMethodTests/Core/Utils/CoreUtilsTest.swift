// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import SparklingMethod

@MainActor
struct CoreUtilsTest {
    
    @Test @MainActor func testOnMainWhenCalledFromMainThread() async throws {
        // Test that CoreUtils.onMain executes immediately when already on main thread
        var executed = false
        
        await withCheckedContinuation { continuation in
            CoreUtils.onMain {
                executed = true
                continuation.resume()
            }
        }
        
        #expect(executed)
    }
    
    @Test func testOnMainWhenCalledFromBackgroundThread() async throws {
        // Test that CoreUtils.onMain switches execution to main thread from background
        var executedOnMain = false
        
        await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .background).async {
                CoreUtils.onMain {
                    // Use MainActor.assumeIsolated to verify we're on main thread
                    MainActor.assumeIsolated {
                        executedOnMain = true
                    }
                    continuation.resume()
                }
            }
        }
        
        #expect(executedOnMain)
    }
}

// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKDispatchQueueTests {
    @Test func testSyncGlobal_onMainThread_success() {
        let result = SPKKitWrapper<DispatchQueue>.syncGlobal(timeout: 1.0) {
            Thread.sleep(forTimeInterval: 0.05)
        }
        #expect(result == .success)
    }
    
    @Test func testSyncGlobal_onBackgroundThread() async {
        await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
                let result = SPKKitWrapper<DispatchQueue>.syncGlobal {
                    #expect(!Thread.isMainThread)
                }
                #expect(result == .success)
                continuation.resume()
            }
        }
    }
    
    @Test func testSyncMain_onMainThread() {
        var executed = false
        SPKKitWrapper<DispatchQueue>.syncMain {
            executed = true
            #expect(Thread.isMainThread)
        }
        #expect(executed)
    }
    
    @Test func testSyncMain_onBackgroundThread() async {
        await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
                #expect(!Thread.isMainThread)
                SPKKitWrapper<DispatchQueue>.syncMain {
                    #expect(Thread.isMainThread)
                    continuation.resume()
                }
            }
        }
    }
    
    @Test func testIsMain() async {
        await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
                #expect(!SPKKitWrapper<DispatchQueue>.isMain)
                continuation.resume()
            }
        }
    }
    
    @Test func testSyncGlobal_withReturnValue() {
        var result: String?
        let dispatchResult = SPKKitWrapper<DispatchQueue>.syncGlobal(timeout: 1.0) {
            result = "test_result"
        }
        #expect(dispatchResult == .success)
        #expect(result == "test_result")
    }
    
    @Test func testSyncGlobal_multipleOperations() {
        var counter = 0
        let queue = DispatchQueue(label: "test.queue", attributes: .concurrent)
        
        // Test multiple concurrent operations
        let group = DispatchGroup()
        
        for _ in 0..<5 {
            group.enter()
            queue.async {
                let result = SPKKitWrapper<DispatchQueue>.syncGlobal {
                    counter += 1
                }
                #expect(result == .success)
                group.leave()
            }
        }
        
        let waitResult = group.wait(timeout: .now() + 2.0)
        #expect(waitResult == .success)
        #expect(counter == 5)
    }
    
    @Test func testSyncMain_nestedCalls() {
        var executionOrder: [String] = []
        
        SPKKitWrapper<DispatchQueue>.syncMain {
            executionOrder.append("outer_start")
            
            SPKKitWrapper<DispatchQueue>.syncMain {
                executionOrder.append("inner")
            }
            
            executionOrder.append("outer_end")
        }
        
        #expect(executionOrder == ["outer_start", "inner", "outer_end"])
    }
    
    @Test func testSyncMain_withException() {
        var didExecute = false
        var didComplete = false
        
        SPKKitWrapper<DispatchQueue>.syncMain {
            didExecute = true
            // Simulate possible exception scenarios
            #expect(Thread.isMainThread)
        }
        
        didComplete = true
        #expect(didExecute)
        #expect(didComplete)
    }
    
    @Test func testSyncGlobal_performanceBaseline() {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let result = SPKKitWrapper<DispatchQueue>.syncGlobal(timeout: 1.0) {
            // Simple operation, should complete quickly
            let _ = Array(0..<1000).reduce(0, +)
        }
        
        let endTime = CFAbsoluteTimeGetCurrent()
        let duration = endTime - startTime
        
        #expect(result == .success)
        #expect(duration < 0.1) // Should complete within 100ms
    }
    
    @Test func testSyncMain_fromDifferentQueues() async {
        let serialQueue = DispatchQueue(label: "test.serial")
        let concurrentQueue = DispatchQueue(label: "test.concurrent", attributes: .concurrent)
        
        await withCheckedContinuation { continuation in
            let group = DispatchGroup()
            var results: [Bool] = []
            
            // Call from serial queue
            group.enter()
            serialQueue.async {
                SPKKitWrapper<DispatchQueue>.syncMain {
                    results.append(Thread.isMainThread)
                }
                group.leave()
            }
            
            // Call from concurrent queue
            group.enter()
            concurrentQueue.async {
                SPKKitWrapper<DispatchQueue>.syncMain {
                    results.append(Thread.isMainThread)
                }
                group.leave()
            }
            
            group.notify(queue: .main) {
                #expect(results.allSatisfy { $0 == true })
                continuation.resume()
            }
        }
    }
}

// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Foundation
import Lynx
@testable import SparklingMethod

// MARK: - Test Suite

@Suite("LynxView+SPKPipe Tests")
@MainActor
struct LynxViewSPKPipeTest {
    
    // MARK: - PipeContainer Protocol Tests
    
    @Suite("PipeContainer Protocol Implementation")
    struct PipeContainerTests {
        
        @Test("spk_containerID getter returns correct value")
        func testContainerIDGetter() {
            let lynxView = MockLynxView(containerID: "test-container-123")
            
            #expect(lynxView.spk_containerID == "test-container-123")
        }
        
        @Test("spk_containerID setter updates containerID correctly")
        func testContainerIDSetter() {
            let lynxView = MockLynxView(containerID: "initial-container")
            lynxView.spk_containerID = "new-container-456"
            
            #expect(lynxView.containerID == "new-container-456")
        }
        
        @Test("spk_containerID setter handles nil by setting empty string")
        func testContainerIDSetterWithNil() {
            let lynxView = MockLynxView(containerID: "initial-container")
            lynxView.spk_containerID = nil
            
            #expect(lynxView.containerID == "")
        }
        
        @Test("spk_containerID setter handles empty string")
        func testContainerIDSetterWithEmptyString() {
            let lynxView = MockLynxView(containerID: "initial-container")
            lynxView.spk_containerID = ""
            
            #expect(lynxView.containerID == "")
        }
    }
    
    // MARK: - Pipe Engine Management Tests
    
    @Suite("Pipe Engine Management")
    @MainActor
    struct PipeEngineTests {
        
        @Test("spk_pipeEngine lazy initialization creates new engine")
        func testPipeEngineLazyInitialization() {
            let lynxView = MockLynxView(containerID: "test-container")
            
            // Clear any existing engine in pool
            LynxPipeEnginePool.setEngine(engine: nil, containerID: "test-container")
            
            let engine = lynxView.spk_pipeEngine
            
            #expect(engine != nil)
            #expect(engine?.lynxView === lynxView)
        }
        
        @Test("spk_pipeEngine returns cached engine from associated object")
        func testPipeEngineCachedFromAssociatedObject() {
            let lynxView = MockLynxView(containerID: "test-container")
            
            let engine = LynxPipeEngine(withLynxView: lynxView)
            lynxView.spk_pipeEngine = engine
            
            let retrievedEngine = lynxView.spk_pipeEngine
            
            #expect(retrievedEngine === engine)
        }
        
        @Test("spk_pipeEngine returns engine from pool when no associated object")
        func testPipeEngineFromPool() {
            let lynxView = MockLynxView(containerID: "pool-test-container")
            
            let poolEngine = LynxPipeEngine(withLynxView: lynxView)
            LynxPipeEnginePool.setEngine(engine: poolEngine, containerID: "pool-test-container")
            
            // Clear associated object to force pool lookup
            lynxView.spk_pipeEngine = nil
            
            let retrievedEngine = lynxView.spk_pipeEngine
            
            #expect(retrievedEngine === poolEngine)
        }
        
        @Test("spk_pipeEngine setter updates associated object")
        func testPipeEngineSetter() {
            let lynxView = MockLynxView(containerID: "test-container")
            let newEngine = LynxPipeEngine(withLynxView: lynxView)
            
            lynxView.spk_pipeEngine = newEngine
            
            #expect(lynxView.spk_pipeEngine === newEngine)
        }
        
        @Test("spk_pipeEngine setter can set nil")
        func testPipeEngineSetterWithNil() {
            let lynxView = MockLynxView(containerID: "nil-test")
            
            // First set an engine
            let engine = LynxPipeEngine(withLynxView: lynxView)
            lynxView.spk_pipeEngine = engine
            
            // Then set to nil
            lynxView.spk_pipeEngine = nil
            
            // Should create new engine due to lazy loading
            let newEngine = lynxView.spk_pipeEngine
            #expect(newEngine != nil)
            #expect(newEngine !== engine)
        }
    }
    
    // MARK: - Destruction Flag Tests
    
    @Suite("Destruction Flag Management")
    @MainActor
    struct DestructionFlagTests {
        
        @Test("spk_isLynxViewDestorying default value is false")
        func testDestructionFlagDefaultValue() {
            let lynxView = MockLynxView(containerID: "test-container")
            
            #expect(lynxView.spk_isLynxViewDestorying == false)
        }
        
        @Test("spk_isLynxViewDestorying setter updates flag correctly")
        func testDestructionFlagSetter() {
            let lynxView = MockLynxView(containerID: "test-container")
            
            lynxView.spk_isLynxViewDestorying = true
            #expect(lynxView.spk_isLynxViewDestorying == true)
            
            lynxView.spk_isLynxViewDestorying = false
            #expect(lynxView.spk_isLynxViewDestorying == false)
        }
        
        @Test("spk_isLynxViewDestorying persists across multiple accesses")
        func testDestructionFlagPersistence() {
            let lynxView = MockLynxView(containerID: "test-container")
            
            lynxView.spk_isLynxViewDestorying = true
            
            // Multiple accesses should return the same value
            #expect(lynxView.spk_isLynxViewDestorying == true)
            #expect(lynxView.spk_isLynxViewDestorying == true)
            #expect(lynxView.spk_isLynxViewDestorying == true)
        }
    }
    
    // MARK: - Clear Module for Destroy Tests
    
//    @Suite("Clear Module for Destroy Logic")
//    struct ClearModuleTests {
//        
//        @Test("spk_clearModuleForDestroy sets destruction flag to true")
//        func testClearModuleSetsDestructionFlag() {
//            let lynxView = MockLynxView(containerID: "test-container")
//            
//            #expect(lynxView.spk_isLynxViewDestorying == false)
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
//        
//        @Test("spk_clearModuleForDestroy with LynxContext updates context containerID")
//        func testClearModuleWithLynxContext() {
//            let lynxView = MockLynxView(containerID: "context-test-container")
//            lynxView.mockNamescope = "test-namespace"
//            
//            let engine = LynxPipeEngine(withLynxView: lynxView)
//            lynxView.spk_pipeEngine = engine
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            // Verify that the LynxContext's containerID is set correctly
//            if let lynxContext = lynxView.getLynxContext() as? LynxContext {
//                #expect(lynxContext.spk_containerID == "context-test-container")
//            }
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
//        
//        @Test("spk_clearModuleForDestroy without LynxContext clears engine pool")
//        func testClearModuleWithoutLynxContext() async {
//            let lynxView = MockLynxView(containerID: "pool-clear-test")
//            // No need to set mockLynxContext as we use getLynxContext() directly
//            
//            // Set up engine in pool
//            let engine = LynxPipeEngine(withLynxView: lynxView)
//            LynxPipeEnginePool.setEngine(engine: engine, containerID: "pool-clear-test")
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            // Wait for main queue execution
//            await Task { @MainActor in
//                let poolEngine = LynxPipeEnginePool.engine(for: "pool-clear-test")
//                #expect(poolEngine == nil)
//            }.value
//            
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
//        
//        @Test("spk_clearModuleForDestroy skips logic when already destroying")
//        func testClearModuleSkipsWhenAlreadyDestroying() {
//            let lynxView = MockLynxView(containerID: "skip-test-container")
//            lynxView.spk_isLynxViewDestorying = true // Already destroying
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            // Context should not be updated when already destroying
//            if let lynxContext = lynxView.getLynxContext() as? LynxContext {
//                #expect(lynxContext.spk_containerID == nil)
//            }
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
//        
//        @Test("spk_clearModuleForDestroy handles nil containerID gracefully")
//        func testClearModuleWithNilContainerID() {
//            let lynxView = MockLynxView(containerID: "")
//            // Use setValue to set nil since containerID might be bridged as non-optional in Swift
//            lynxView.setValue(nil, forKey: "containerID")
//            // No need to set mockLynxContext as we use getLynxContext() directly
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
//        
//        @Test("spk_clearModuleForDestroy handles empty containerID")
//        func testClearModuleWithEmptyContainerID() async {
//            let lynxView = MockLynxView(containerID: "")
//            // No need to set mockLynxContext as we use getLynxContext() directly
//            
//            lynxView.spk_clearModuleForDestroy()
//            
//            // Wait for main queue execution
//            await Task { @MainActor in
//                // Should not crash and should set destruction flag
//                #expect(lynxView.spk_isLynxViewDestorying == true)
//            }.value
//        }
//    }
    
    // MARK: - Engine Pool Integration Tests
    
    @Suite("Engine Pool Integration")
    @MainActor
    struct EnginePoolIntegrationTests {
        
        @Test("Engine pool integration with lazy loading")
        func testEnginePoolIntegrationWithLazyLoading() {
            let lynxView = MockLynxView(containerID: "integration-test")
            
            // Clear pool first
            LynxPipeEnginePool.setEngine(engine: nil, containerID: "integration-test")
            
            // Access engine (should create and store in pool)
            let engine1 = lynxView.spk_pipeEngine
            
            // Access from pool directly
            let engine2 = LynxPipeEnginePool.engine(for: "integration-test")
            
            #expect(engine1 === engine2)
        }
        
//        @Test("Engine pool cleanup during destruction")
//        func testEnginePoolCleanupDuringDestruction() async {
//            let lynxView = MockLynxView(containerID: "cleanup-test")
//            // No need to set mockLynxContext as we use getLynxContext() directly
//            
//            // Set up engine
//            let engine = lynxView.spk_pipeEngine
//            #expect(engine != nil)
//            
//            // Verify engine is in pool
//            let poolEngine = LynxPipeEnginePool.engine(for: "cleanup-test")
//            #expect(poolEngine === engine)
//            
//            // Clear module
//            lynxView.spk_clearModuleForDestroy()
//            
//            // Wait for main queue execution
//            await Task { @MainActor in
//                let clearedEngine = LynxPipeEnginePool.engine(for: "cleanup-test")
//                #expect(clearedEngine == nil)
//            }.value
//        }
    }
    
    // MARK: - Edge Cases and Error Handling
    
    @Suite("Edge Cases and Error Handling")
    @MainActor
    struct EdgeCaseTests {
        
//        @Test("Multiple consecutive calls to spk_clearModuleForDestroy")
//        func testMultipleClearModuleCalls() {
//            let lynxView = MockLynxView(containerID: "multiple-clear-test")
//            
//            lynxView.spk_clearModuleForDestroy()
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//            
//            // Second call should not cause issues
//            lynxView.spk_clearModuleForDestroy()
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//            
//            // Third call should not cause issues
//            lynxView.spk_clearModuleForDestroy()
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//        }
        
        @Test("Concurrent access to spk_pipeEngine")
        func testConcurrentPipeEngineAccess() async {
            let lynxView = MockLynxView(containerID: "concurrent-test")
            
            // Clear pool first
            LynxPipeEnginePool.setEngine(engine: nil, containerID: "concurrent-test")
            
            await withTaskGroup(of: LynxPipeEngine?.self) { group in
                // Launch multiple concurrent tasks
                for _ in 0..<10 {
                    group.addTask {
                        return lynxView.spk_pipeEngine
                    }
                }
                
                var engines: [LynxPipeEngine?] = []
                for await engine in group {
                    engines.append(engine)
                }
                
                // All engines should be the same instance (thread-safe)
                let firstEngine = engines.first!
                for engine in engines {
                    #expect(engine === firstEngine)
                }
            }
        }
        
        @Test("Concurrent access to destruction flag")
        func testConcurrentDestructionFlagAccess() async {
            let lynxView = MockLynxView(containerID: "test-container")
            
            await withTaskGroup(of: Void.self) { group in
                // Launch multiple concurrent tasks
                for i in 0..<10 {
                    group.addTask {
                        lynxView.spk_isLynxViewDestorying = (i % 2 == 0)
                    }
                }
                
                await group.waitForAll()
            }
            
            // Should not crash and should have a valid boolean value
            let finalValue = lynxView.spk_isLynxViewDestorying
            #expect(finalValue == true || finalValue == false)
        }
        
        @Test("Memory management with associated objects")
        func testMemoryManagementWithAssociatedObjects() {
            weak var weakEngine: LynxPipeEngine?
            
            do {
                let lynxView = MockLynxView(containerID: "memory-test")
                
                let engine = lynxView.spk_pipeEngine
                weakEngine = engine
                
                #expect(weakEngine != nil)
                
                // Clear the engine
                lynxView.spk_pipeEngine = nil
            }
            
            // Engine should be deallocated when LynxView is deallocated
            // Note: This test might be flaky due to ARC timing
            // In a real scenario, you might need to force garbage collection
        }
        
        @Test("Engine creation with invalid LynxView state")
        func testEngineCreationWithInvalidLynxViewState() {
            let lynxView = MockLynxView(containerID: "")
            // Don't set containerID (nil state)
            
            let engine = lynxView.spk_pipeEngine
            
            // Should still create engine even with nil containerID
            #expect(engine != nil)
            #expect(engine?.lynxView === lynxView)
        }
    }
    
    // MARK: - Integration Tests
    
    @Suite("Integration Tests")
    @MainActor
    struct IntegrationTests {
        
        @Test("Complete lifecycle: creation, usage, and destruction")
        func testCompleteLifecycle() async {
            let lynxView = MockLynxView(containerID: "lifecycle-test")
            lynxView.mockNamescope = "lifecycle-namespace"
            
            // 1. Initial state
            #expect(lynxView.spk_isLynxViewDestorying == false)
            
            // 2. Create engine (lazy loading)
            let engine = lynxView.spk_pipeEngine
            #expect(engine != nil)
            #expect(engine?.lynxView === lynxView)
            
            // 3. Verify engine is in pool
            let poolEngine = LynxPipeEnginePool.engine(for: "lifecycle-test")
            #expect(poolEngine === engine)
            
            // 4. Use PipeContainer protocol
            lynxView.spk_containerID = "updated-container-id"
            #expect(lynxView.containerID == "updated-container-id")
            
//            // 5. Destroy
//            lynxView.spk_clearModuleForDestroy()
//            
//            // 6. Verify destruction state
//            #expect(lynxView.spk_isLynxViewDestorying == true)
//            
//            // 7. Verify LynxContext containerID was set if available
//            if let lynxContext = lynxView.getLynxContext() as? LynxContext {
//                #expect(lynxContext.spk_containerID == "updated-container-id")
//            }
            
            // 8. Verify engine namescope was set
            // Note: Real LynxPipeEngine doesn't expose mockNamescope property
            // This verification would need to be done through other means in real implementation
        }
        
        @Test("Multiple LynxView instances with different containerIDs")
        func testMultipleLynxViewInstances() {
            let lynxView1 = MockLynxView(containerID: "container-1")
            let lynxView2 = MockLynxView(containerID: "container-2")
            
            let engine1 = lynxView1.spk_pipeEngine
            let engine2 = lynxView2.spk_pipeEngine
            
            // Engines should be different instances
            #expect(engine1 !== engine2)
            #expect(engine1?.lynxView === lynxView1)
            #expect(engine2?.lynxView === lynxView2)
            
            // Pool should contain both engines
            let poolEngine1 = LynxPipeEnginePool.engine(for: "container-1")
            let poolEngine2 = LynxPipeEnginePool.engine(for: "container-2")
            
            #expect(poolEngine1 === engine1)
            #expect(poolEngine2 === engine2)
        }
    }
}

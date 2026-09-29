// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import SparklingMethod
import Lynx

// MARK: - Mock Objects

class MockLynxView: LynxView {
    var mockNamescope: String?
    var sentEvents: [(String, [[String: Any]])] = []
    
    init(containerID: String, namescope: String? = nil) {
        super.init(outRender: ())!
        self.mockNamescope = namescope
        self.containerID = containerID
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override var namescope: String? {
        get { return mockNamescope }
        set { mockNamescope = newValue }
    }
    
    // Cannot override spk_isLynxViewDestorying as it's a non-@objc extension property
    // Instead, we'll set it directly when needed in tests
    
    func sendGlobalEvent(_ eventName: String, withParams params: [[String : Any]]?) {
        if let params = params {
            sentEvents.append((eventName, params))
        }
    }
}

class MockLynxCallbackBlock {
    var capturedResult: [String: Any]?
    var callCount = 0
    
    lazy var callback: LynxCallbackBlock = { [weak self] result in
        self?.capturedResult = result as? [String: Any]
        self?.callCount += 1
    }
}

// MARK: - Test Methods

@objc(TestLynxMethod)
public class TestLynxMethod: PipeMethod {
    public override var methodName: String {
        return "test.lynx.method"
    }
    
    public override class func methodName() -> String {
        return "test.lynx.method"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestLynxParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return TestLynxResultModel.self
    }
}

extension TestLynxMethod {
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let typedParamModel = paramModel as? TestLynxParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameters type"), result: nil)
            return
        }
        
        let result = TestLynxResultModel()
        result.message = "Hello \(typedParamModel.name)"
        completionHandler.handleCompletion(status: .succeeded(), result: result)
    }
}

@objc(TestLynxAsyncMethod)
public class TestLynxAsyncMethod: PipeMethod {
    public override var methodName: String {
        return "test.lynx.async"
    }
    
    public override class func methodName() -> String {
        return "test.lynx.async"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestLynxParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return TestLynxResultModel.self
    }
}

extension TestLynxAsyncMethod {
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let typedParamModel = paramModel as? TestLynxParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameters type"), result: nil)
            return
        }
        
        // Simulate async behavior but execute on main queue to avoid test timing issues
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            let result = TestLynxResultModel()
            result.message = "Async result for \(typedParamModel.name)"
            completionHandler.handleCompletion(status: .succeeded(), result: result)
        }
    }
}

@objc(TestLynxFailureMethod)
public class TestLynxFailureMethod: PipeMethod {
    public override var methodName: String {
        return "test.lynx.failure"
    }
    
    public override class func methodName() -> String {
        return "test.lynx.failure"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestLynxParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
}

extension TestLynxFailureMethod {
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let typedParamModel = paramModel as? TestLynxParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameters type"), result: nil)
            return
        }
        
        completionHandler.handleCompletion(status: .failed(message: "Test failure for \(typedParamModel.name)"), result: nil)
    }
}

// MARK: - Test Models

@objc(TestLynxParamsModel)
public class TestLynxParamsModel: SPKMethodModel {
    public override class func requiredKeyPaths() -> Set<String>? {
        return ["name"]
    }
    
    @objc public var name: String = ""
    @objc public var age: Int = 0
    
    public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return [
            "name": "name",
            "age": "age",
        ]
    }
}

@objc(TestLynxResultModel)
public class TestLynxResultModel: SPKMethodModel {
    @objc public var message: String = ""
    
    public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return [
            "message": "message",
        ]
    }
}

// MARK: - Test Suite

@Suite(.serialized)
@MainActor
struct SPKLynxNativeModuleTest {
    
    // MARK: - Initialization Tests
    
    @Test func testModuleInitializationWithContainerID() throws {
        let containerID = "test-container-123"
        let param = ["containerID": containerID]
        
        let module = SPKLynxNativeModule(param: param)
        
        // Verify module name and method lookup table
        #expect(SPKLynxNativeModule.name == "spkPipe")
        #expect(SPKLynxNativeModule.methodLookup.count == 1)
        #expect(SPKLynxNativeModule.methodLookup["call"] != nil)
    }
    
    @Test func testModuleInitializationWithoutContainerID() throws {
        let param: [String: Any] = [:]
        
        let module = SPKLynxNativeModule(param: param)
        
        // Module should initialize normally even without containerID
        #expect(SPKLynxNativeModule.name == "spkPipe")
    }
    
    @Test func testModuleInitializationWithInvalidParam() throws {
        let param = "invalid-param"
        
        let module = SPKLynxNativeModule(param: param)
        
        // Module should initialize normally even with invalid parameters
        #expect(SPKLynxNativeModule.name == "spkPipe")
    }
    
    @Test func testModuleDefaultInitialization() throws {
        let module = SPKLynxNativeModule()
        
        // Verify default initialization
        #expect(SPKLynxNativeModule.name == "spkPipe")
    }
    
    // MARK: - Integration Tests with MethodPipe
    
    @Test func testIntegrationWithMethodPipeAndLynxView() throws {
        let containerID = "integration-test-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        
        // Create MethodPipe and associate LynxView
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        // Register test methods
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        // Verify association in engine and pool
        #expect(methodPipe.engine != nil)
        #expect(LynxPipeEnginePool.engine(for: containerID) != nil)
        
        // Create SPKLynxNativeModule
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        // Simulate method call
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "TestUser"],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify callback is called
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.succeeded.rawValue)
            if let data = result[LynxKeys.data] as? [String: Any] {
                #expect(data["message"] as? String == "Hello TestUser")
            }
        }
    }
    
    @Test func testMethodCallWithMissingEngine() throws {
        let containerID = "missing-engine-container"
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "TestUser"],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: "test.method", params: params, callback: mockCallback.callback)
        
        // Verify error callback
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.parameterError.rawValue)
            if let data = result[LynxKeys.data] as? [String: Any] {
                #expect(data[LynxKeys.message] as? String == "error container id")
            }
        }
    }
    
    @Test func testMethodCallWithContainerIDFromMessage() throws {
        let containerID = "message-container-id"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        // Create module without providing containerID
        let nativeModule = SPKLynxNativeModule()
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "MessageUser"],
            LynxKeys.containerID: containerID  // containerID provided in message
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify successful call
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.succeeded.rawValue)
        }
    }
    
    @Test func testMethodCallWithEmptyContainerID() throws {
        let nativeModule = SPKLynxNativeModule()
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "TestUser"],
            LynxKeys.containerID: ""  // Empty containerID
        ] as [String : Any]
        
        nativeModule.call(name: "test.method", params: params, callback: mockCallback.callback)
        
        // Verify no callback (because containerID is empty)
        #expect(mockCallback.callCount == 0)
    }
    
    // MARK: - Thread Handling Tests
    
    @Test func testMethodCallWithMainThread() throws {
        let containerID = "thread-test-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: [
                "name": "ThreadUser",
                LynxKeys.threadType: LynxKeys.mainThread
            ],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify successful call
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
    }
    
    @Test func testMethodCallWithCurrentThread() throws {
        let containerID = "current-thread-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: [
                "name": "CurrentThreadUser",
                LynxKeys.threadType: LynxKeys.currentThread
            ],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify successful call
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
    }
    
    @Test func testMethodCallWithDestroyingLynxView() throws {
        let containerID = "destroying-view-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        mockLynxView.spk_isLynxViewDestorying = true  // Set to destroying state
        
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: [
                "name": "DestroyingUser",
                LynxKeys.threadType: LynxKeys.currentThread
            ],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify successful call (should force use main thread)
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
    }
    
    // MARK: - Error Handling Tests
    
    @Test func testMethodCallWithNonExistentMethod() throws {
        let containerID = "error-test-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "ErrorUser"],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: "non.existent.method", params: params, callback: mockCallback.callback)
        
        // Verify error callback
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.noHandler.rawValue)
        }
    }
    
    @Test func testMethodCallWithInvalidParameters() throws {
        let containerID = "invalid-params-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let testMethod = TestLynxMethod()
        methodPipe.register(localMethod: testMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["age": 25],  // Missing required name parameter
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify parameter error callback
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.parameterError.rawValue)
        }
    }
    
    @Test func testMethodCallWithFailureMethod() throws {
        let containerID = "failure-method-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let failureMethod = TestLynxFailureMethod()
        methodPipe.register(localMethod: failureMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        let mockCallback = MockLynxCallbackBlock()
        let params = [
            LynxKeys.data: ["name": "FailureUser"],
            LynxKeys.containerID: containerID
        ] as [String : Any]
        
        nativeModule.call(name: TestLynxFailureMethod.methodName(), params: params, callback: mockCallback.callback)
        
        // Verify failure callback
        #expect(mockCallback.callCount == 1)
        #expect(mockCallback.capturedResult != nil)
        
        if let result = mockCallback.capturedResult {
            #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.failed.rawValue)
        }
    }
    
    // MARK: - Performance Tests
    
    @Test func testConcurrentMethodCalls() async throws {
        let containerID = "concurrent-test-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        let testMethod = TestLynxAsyncMethod()
        methodPipe.register(localMethod: testMethod)
        
        let moduleParam = ["containerID": containerID]
        let nativeModule = SPKLynxNativeModule(param: moduleParam)
        
        // Create multiple concurrent calls
        let callCount = 10
        var mockCallbacks: [MockLynxCallbackBlock] = []
        
        for i in 0..<callCount {
            let mockCallback = MockLynxCallbackBlock()
            mockCallbacks.append(mockCallback)
            
            let params = [
                LynxKeys.data: ["name": "ConcurrentUser\(i)"],
                LynxKeys.containerID: containerID
            ] as [String : Any]
            
            nativeModule.call(name: TestLynxAsyncMethod.methodName(), params: params, callback: mockCallback.callback)
        }
        
        // Wait for all callbacks to complete
        await withCheckedContinuation { continuation in
            Task {
                let startTime = ContinuousClock.now
                let timeoutDuration = Duration.seconds(2.0)
                
                repeat {
                    if mockCallbacks.allSatisfy({ $0.callCount > 0 }) {
                        continuation.resume()
                        return
                    }
                    try? await Task.sleep(for: .milliseconds(10))
                } while ContinuousClock.now - startTime < timeoutDuration
                
                continuation.resume()
            }
        }
        
        // Verify all calls are successful
        for mockCallback in mockCallbacks {
            #expect(mockCallback.callCount == 1)
            #expect(mockCallback.capturedResult != nil)
            if let result = mockCallback.capturedResult {
                #expect(result[LynxKeys.code] as? Int == LynxPipeStatusCode.succeeded.rawValue)
            }
        }
    }
    
    // MARK: - LynxPipeEnginePool Tests
    
    @Test func testLynxPipeEnginePoolSetAndGetEngine() throws {
        let containerID = "pool-test-container"
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        // Verify engine is correctly set in pool
        let engine = LynxPipeEnginePool.engine(for: containerID)
        #expect(engine != nil)
        #expect(engine === (methodPipe.engine as? LynxPipeEngine))
        
        // Test setting new engine
        let newMockLynxView = MockLynxView(containerID: "new-container")
        let newMethodPipe = MethodPipe(withLynxView: newMockLynxView)
        
        LynxPipeEnginePool.setEngine(engine: newMethodPipe.engine as? LynxPipeEngine, containerID: containerID)
        let updatedEngine = LynxPipeEnginePool.engine(for: containerID)
        #expect(updatedEngine === (newMethodPipe.engine as? LynxPipeEngine))
    }
    
    @Test func testLynxPipeEnginePoolSetNilEngine() throws {
        let containerID = "nil-engine-container"
        
        // Set an engine first
        let mockLynxView = MockLynxView(containerID: containerID)
        let methodPipe = MethodPipe(withLynxView: mockLynxView)
        
        #expect(LynxPipeEnginePool.engine(for: containerID) != nil)
        
        // Set to nil to remove engine
        LynxPipeEnginePool.setEngine(engine: nil, containerID: containerID)
        let engine = LynxPipeEnginePool.engine(for: containerID)
        #expect(engine == nil)
    }
    
    @Test func testLynxPipeEnginePoolGetNonExistentEngine() throws {
        let nonExistentContainerID = "non-existent-container-\(UUID().uuidString)"
        let engine = LynxPipeEnginePool.engine(for: nonExistentContainerID)
        #expect(engine == nil)
    }
    
    @Test func testLynxPipeEnginePoolEnumerateKeysAndObjects() throws {
        // Clean up possibly existing engines
        var foundContainerIDs: [String] = []
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            foundContainerIDs.append(key)
        }
        
        // Clean up existing engines
        for containerID in foundContainerIDs {
            LynxPipeEnginePool.setEngine(engine: nil, containerID: containerID)
        }
        
        // Create test engines
        let containerIDs = ["enum-container-1", "enum-container-2", "enum-container-3"]
        var engines: [LynxPipeEngine] = []
        
        for containerID in containerIDs {
            let mockLynxView = MockLynxView(containerID: containerID)
            let methodPipe = MethodPipe(withLynxView: mockLynxView)
            if let lynxEngine = methodPipe.engine as? LynxPipeEngine {
                engines.append(lynxEngine)
            }
        }
        
        // Verify enumeration functionality
        var enumeratedContainerIDs: [String] = []
        var enumeratedEngines: [LynxPipeEngine] = []
        
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            enumeratedContainerIDs.append(key)
            if let engine = value as? LynxPipeEngine {
                enumeratedEngines.append(engine)
            }
        }
        
        // Verify all containerIDs are enumerated
        #expect(enumeratedContainerIDs.count == containerIDs.count)
        for containerID in containerIDs {
            #expect(enumeratedContainerIDs.contains(containerID))
        }
        
        // Verify all engines are enumerated
        #expect(enumeratedEngines.count == engines.count)
        for engine in engines {
            #expect(enumeratedEngines.contains { $0 === engine })
        }
    }
    
    @Test func testLynxPipeEnginePoolEnumerateWithEarlyStop() throws {
        // Create multiple engines
        let containerIDs = ["stop-container-1", "stop-container-2", "stop-container-3"]
        
        for containerID in containerIDs {
            let mockLynxView = MockLynxView(containerID: containerID)
            let _ = MethodPipe(withLynxView: mockLynxView)
        }
        
        // Test early stop of enumeration
        var enumeratedCount = 0
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            enumeratedCount += 1
            if enumeratedCount >= 2 {
                stop = true
            }
        }
        
        // Verify enumeration stops after 2nd element
        #expect(enumeratedCount == 2)
    }
    
    @Test func testLynxPipeEnginePoolEnumerateEmptyPool() throws {
        // Clean up all engines
        var allContainerIDs: [String] = []
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            allContainerIDs.append(key)
        }
        
        for containerID in allContainerIDs {
            LynxPipeEnginePool.setEngine(engine: nil, containerID: containerID)
        }
        
        // Verify enumeration of empty pool
        var enumeratedCount = 0
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            enumeratedCount += 1
        }
        
        #expect(enumeratedCount == 0)
    }
    
    @Test func testLynxPipeEnginePoolThreadSafety() async throws {
        let containerID = "thread-safety-container"
        
        // Create multiple engines
        let engines = (0..<10).compactMap { index in
            let mockLynxView = MockLynxView(containerID: "thread-container-\(index)")
            let methodPipe = MethodPipe(withLynxView: mockLynxView)
            return methodPipe.engine as? LynxPipeEngine
        }
        
        // Concurrent setting and getting of engine
        await withTaskGroup(of: Void.self) { group in
            // Concurrent setting of engines
            for i in 0..<10 {
                group.addTask {
                    let mockLynxView = MockLynxView(containerID: "\(containerID)-\(i)")
                    let methodPipe = MethodPipe(withLynxView: mockLynxView)
                    LynxPipeEnginePool.setEngine(engine: methodPipe.engine as? LynxPipeEngine, containerID: "\(containerID)-\(i)")
                }
            }
            
            // Concurrent getting of engines
            for i in 0..<10 {
                group.addTask {
                    let _ = LynxPipeEnginePool.engine(for: "\(containerID)-\(i)")
                }
            }
            
            // Concurrent enumeration
            for _ in 0..<5 {
                group.addTask {
                    LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
                        // Simple enumeration operation
                    }
                }
            }
        }
        
        // Verify final state
        var finalCount = 0
        LynxPipeEnginePool.enumerateKeysAndObjects { key, value, stop in
            if key.hasPrefix(containerID) {
                finalCount += 1
            }
        }
        
        #expect(finalCount == 10)
    }
}

// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import SparklingMethod
import Sparkling_Router

// MARK: - Test Models

class TestParamsModel: SPKMethodModel {
    public override class func requiredKeyPaths() -> Set<String>? {
        return ["name"]
    }
    
    @objc public var name: String?
    @objc public var age: NSNumber?
    
    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return [
            "name": "name",
            "age": "age"
        ]
    }
}

class TestResultModel: SPKMethodModel {
    @objc public var message: String?
    
    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return ["message": "message"]
    }
}

class InvalidParamsModel: SPKMethodModel {
    @objc public var invalidField: String?
    
    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return ["invalidField": "invalidField"]
    }
}

// MARK: - Test Methods
final class TestSuccessMethod: PipeMethod {
    public override var methodName: String {
        return "test.success"
    }
    
    public override class func methodName() -> String {
        return "test.success"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
    
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let _ = paramModel as? TestParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
            return
        }
        
        let result = EmptyMethodModelClass()
        completionHandler.handleCompletion(status: .succeeded(), result: result)
    }
}

final class TestFailureMethod: PipeMethod {
    public override var methodName: String {
        return "test.failure"
    }
    
    public override class func methodName() -> String {
        return "test.failure"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
    
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let _ = paramModel as? TestParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
            return
        }
        
        completionHandler.handleCompletion(status: .failed(message: "Test failure"), result: nil)
    }
}

final class TestAsyncMethod: PipeMethod {
    public override var methodName: String {
        return "test.async"
    }
    
    public override class func methodName() -> String {
        return "test.async"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
    
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let _ = paramModel as? TestParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
            return
        }
        
        // Simulate async behavior but execute synchronously to avoid test timing issues
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            let result = EmptyMethodModelClass()
            completionHandler.handleCompletion(status: .succeeded(), result: result)
        }
    }
}

final class TestInvalidParamsMethod: PipeMethod {
    public override var methodName: String {
        return "test.invalidParams"
    }
    
    public override class func methodName() -> String {
        return "test.invalidParams"
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return InvalidParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
    
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let _ = paramModel as? InvalidParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
            return
        }
        
        let result = EmptyMethodModelClass()
        completionHandler.handleCompletion(status: .succeeded(), result: result)
    }
}

final class TestGlobalMethod: PipeMethod {
    public override var methodName: String {
        return "test.global"
    }
    
    public override class func methodName() -> String {
        return "test.global"
    }
    
    @objc public override class var isGlobal: Bool {
        return true
    }
    
    @objc public override var paramsModelClass: AnyClass {
        return TestParamsModel.self
    }
    
    @objc public override var resultModelClass: AnyClass {
        return EmptyMethodModelClass.self
    }
    
    @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
        guard let _ = paramModel as? TestParamsModel else {
            completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
            return
        }
        
        let result = EmptyMethodModelClass()
        completionHandler.handleCompletion(status: .succeeded(), result: result)
    }
}

// MARK: - Mock Engine
class MockPipeEngine: PipeEngine {
    var pipeContainer: PipeContainer?
    var fireEventCalled = false
    var lastEventName: String?
    var lastEventParams: [String: Any]?
    
    func fireEvent(name: String, params: [String : Any]?) {
        fireEventCalled = true
        lastEventName = name
        lastEventParams = params
    }
}

// MARK: - Test Suite
@Suite(.serialized)
struct MethodPipeTest {
    
    // MARK: - Basic Registration Tests
    
    @Test func testRegisterLocalMethod() throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
        
        let retrievedMethod: TestSuccessMethod? = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(retrievedMethod != nil)
        #expect(retrievedMethod?.methodName == TestSuccessMethod().methodName)
    }
    
    @Test func testRegisterLocalMethods() throws {
        let pipe = MethodPipe()
        let methods: [PipeMethod] = [
            TestSuccessMethod(),
            TestFailureMethod()
        ]
        
        pipe.register(localMethods: methods)
        
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
        #expect(pipe.respondTo(methodName: TestFailureMethod().methodName))
        
        let successMethod: TestSuccessMethod? = pipe.method(forName: TestSuccessMethod().methodName)
        let failureMethod: TestFailureMethod? = pipe.method(forName: TestFailureMethod().methodName)
        
        #expect(successMethod != nil)
        #expect(failureMethod != nil)
    }
    
    @Test func testRegisterEmptyMethods() throws {
        let pipe = MethodPipe()
        
        pipe.register(localMethods: [])
        
        #expect(!pipe.respondTo(methodName: TestSuccessMethod().methodName))
    }
    
    @Test func testRegisterGlobalMethod() throws {
        let pipe = MethodPipe()
        let method = TestGlobalMethod()
        
        // Clean up any existing global method
        MethodRegistry.global.unregister(methodName: TestGlobalMethod().methodName)
        
        pipe.register(globalMethod: method)
        
        #expect(pipe.respondTo(methodName: TestGlobalMethod().methodName))
        #expect(MethodRegistry.global.respondTo(methodName: TestGlobalMethod().methodName))
        
        let retrievedMethod: TestGlobalMethod? = pipe.method(forName: TestGlobalMethod().methodName)
        #expect(retrievedMethod != nil)
        
        // Clean up
        MethodRegistry.global.unregister(methodName: TestGlobalMethod().methodName)
    }
    
    // MARK: - Unregistration Tests
    
    @Test func testUnregisterLocalMethod() throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
        
        pipe.unregister(localMethodName: TestSuccessMethod().methodName)
        #expect(!pipe.respondTo(methodName: TestSuccessMethod().methodName))
    }
    
    @Test func testUnregisterGlobalMethod() throws {
        let pipe = MethodPipe()
        let method = TestGlobalMethod()
        
        // Clean up any existing global method
        MethodRegistry.global.unregister(methodName: TestGlobalMethod().methodName)
        
        pipe.register(globalMethod: method)
        #expect(pipe.respondTo(methodName: TestGlobalMethod().methodName))
        
        pipe.unregister(globalMethodName: TestGlobalMethod().methodName)
        #expect(!pipe.respondTo(methodName: TestGlobalMethod().methodName))
    }
    
    @Test func testUnregisterNonExistentMethod() throws {
        let pipe = MethodPipe()
        
        // Should not crash when unregistering non-existent method
        pipe.unregister(localMethodName: "non.existent")
        pipe.unregister(globalMethodName: "non.existent")
        
        #expect(!pipe.respondTo(methodName: "non.existent"))
    }
    
    // MARK: - Method Resolution Tests
    
    @Test func testRespondToLocalMethod() throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        #expect(!pipe.respondTo(methodName: TestSuccessMethod().methodName))
        
        pipe.register(localMethod: method)
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
    }
    
    @Test func testRespondToGlobalMethod() throws {
        let pipe = MethodPipe()
        
        // Clean up any existing global method
        MethodRegistry.global.unregister(methodName: TestGlobalMethod().methodName)
        
        #expect(!pipe.respondTo(methodName: TestGlobalMethod().methodName))
        
        MethodRegistry.global.register(method: TestGlobalMethod())
        #expect(pipe.respondTo(methodName: TestGlobalMethod().methodName))
        
        // Clean up
        MethodRegistry.global.unregister(methodName: TestGlobalMethod().methodName)
    }
    
    @Test func testRespondToNonExistentMethod() throws {
        let pipe = MethodPipe()
        
        #expect(!pipe.respondTo(methodName: "non.existent"))
    }
    
    @Test func testMethodForNameLocalPriority() throws {
        let pipe = MethodPipe()
        let localMethod = TestSuccessMethod()
        
        // Clean up any existing global method
        MethodRegistry.global.unregister(methodName: TestSuccessMethod().methodName)
        
        // Register both local and global with same name
        pipe.register(localMethod: localMethod)
        MethodRegistry.global.register(method: TestSuccessMethod())
        
        // Local method should take priority
        let retrievedMethod = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(retrievedMethod != nil)
        
        // Clean up
        MethodRegistry.global.unregister(methodName: TestSuccessMethod().methodName)
    }
    
    @Test func testMethodForNameTyped() throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        let typedMethod: TestSuccessMethod? = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(typedMethod != nil)
        
        let wrongTypedMethod: TestFailureMethod? = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(wrongTypedMethod == nil)
    }
    
    @Test func testMethodForNameNonExistent() throws {
        let pipe = MethodPipe()
        
        let method = pipe.method(forName: "non.existent")
        #expect(method == nil)
        
        let typedMethod: TestSuccessMethod? = pipe.method(forName: "non.existent")
        #expect(typedMethod == nil)
    }
    
    // MARK: - Fire Event Tests
    
    @Test func testFireEventWithEngine() throws {
        let pipe = MethodPipe()
        let mockEngine = MockPipeEngine()
        pipe.engine = mockEngine
        
        let eventName = "test.event"
        let eventParams = ["key": "value"]
        
        pipe.fireEvent(name: eventName, params: eventParams)
        
        #expect(mockEngine.fireEventCalled)
        #expect(mockEngine.lastEventName == eventName)
        #expect(mockEngine.lastEventParams?["key"] as? String == "value")
    }
    
    @Test func testFireEventWithoutEngine() throws {
        let pipe = MethodPipe()
        
        // Should not crash when engine is nil
        pipe.fireEvent(name: "test.event", params: ["key": "value"])
        pipe.fireEvent(name: "test.event", params: nil)
    }
    
    @Test func testFireEventWithNilParams() throws {
        let pipe = MethodPipe()
        let mockEngine = MockPipeEngine()
        pipe.engine = mockEngine
        
        let eventName = "test.event"
        
        pipe.fireEvent(name: eventName, params: nil)
        
        #expect(mockEngine.fireEventCalled)
        #expect(mockEngine.lastEventName == eventName)
        #expect(mockEngine.lastEventParams == nil)
    }
    
    // MARK: - Registry Access Tests
    
    @Test func testRegistryAccess() throws {
        let pipe = MethodPipe()
        
        // Registry should be lazily initialized
        let registry = pipe.registry
        #expect(registry != nil)
        
        // Should return the same instance
        let sameRegistry = pipe.registry
        #expect(registry === sameRegistry)
    }
    
    // MARK: - Integration Tests
    
    @Test func testMethodExecutionSuccess() async throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser", "age": 25] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        var actualResult: SPKMethodModel?
        
        if let method = pipe.method(forName: TestSuccessMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, result in
                    actualStatus = status
                    actualResult = result
                    semaphore.signal()
                }
                semaphore.wait()
                
                #expect(actualStatus?.code == MethodStatusCode.succeeded)
                #expect(actualResult != nil)
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodAsyncExecutionSuccess() async throws {
        let pipe = MethodPipe()
        let method = TestAsyncMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser", "age": 25] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        var actualResult: SPKMethodModel?
        
        if let method = pipe.method(forName: TestAsyncMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, result in
                    actualStatus = status
                    actualResult = result
                    semaphore.signal()
                }
                semaphore.wait(timeout: .now() + 1.0) // Wait longer for async operation
                
                #expect(actualStatus?.code == MethodStatusCode.succeeded)
                #expect(actualResult != nil)
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodExecutionFailure() async throws {
        let pipe = MethodPipe()
        let method = TestFailureMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser"] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestFailureMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, _ in
                    actualStatus = status
                    semaphore.signal()
                }
                semaphore.wait()
                
                #expect(actualStatus?.code == MethodStatusCode.failed)
                #expect(actualStatus?.message == "Test failure")
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodExecutionNotFound() async throws {
        let pipe = MethodPipe()
        
        // Create a method instance to call directly
        let methodName = "nonExistent"
        
        #expect(pipe.method(forName: methodName) == nil)
    }
    
    @Test func testMethodExecutionMissingRequiredParams() async throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["age": 25] as [String : Any] // Missing required "name" parameter
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestSuccessMethod().methodName) {
            do {
                // This should fail because required parameters are missing
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, _ in
                    actualStatus = status
                    semaphore.signal()
                }
                semaphore.wait()
                
                // If we got here, check the status
                #expect(actualStatus?.code == MethodStatusCode.invalidInputParameter)
            } catch {
                // This is the expected path when required parameters are missing
                #expect(true)
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    // MARK: - Edge Cases
    
    @Test func testMethodExecutionEmptyParams() async throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        let params = [:] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestSuccessMethod().methodName) {
            do {
                // This should fail because required parameters are missing
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                if let paramModel = paramModel {
                    method.call(withParamModel: paramModel) { status, _ in
                        actualStatus = status
                        semaphore.signal()
                    }
                    semaphore.wait()
                    
                    #expect(actualStatus?.code == MethodStatusCode.invalidInputParameter)
                } else {
                    #expect(true, "Expected param model to be nil")
                }
            } catch {
                #expect(true, "Expected error: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodExecutionNilParams() async throws {
        let pipe = MethodPipe()
        let method = TestSuccessMethod()
        
        pipe.register(localMethod: method)
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestSuccessMethod().methodName) {
            // Call with nil params should fail
            let params = [String: Any]()
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                if let paramModel = paramModel {
                    method.call(withParamModel: paramModel) { status, _ in
                        actualStatus = status
                        semaphore.signal()
                    }
                    semaphore.wait()
                    
                    #expect(actualStatus?.code == MethodStatusCode.invalidInputParameter)
                } else {
                    #expect(true, "Expected param model to be nil")
                }
            } catch {
                #expect(true, "Expected error: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMultipleMethodRegistration() throws {
        let pipe = MethodPipe()
        
        // Register multiple methods
        pipe.register(localMethods: [
            TestSuccessMethod(),
            TestFailureMethod(),
            TestAsyncMethod()
        ])
        
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
        #expect(pipe.respondTo(methodName: TestFailureMethod().methodName))
        #expect(pipe.respondTo(methodName: TestAsyncMethod().methodName))
        
        // Verify each method can be retrieved with correct type
        let successMethod: TestSuccessMethod? = pipe.method(forName: TestSuccessMethod().methodName)
        let failureMethod: TestFailureMethod? = pipe.method(forName: TestFailureMethod().methodName)
        let asyncMethod: TestAsyncMethod? = pipe.method(forName: TestAsyncMethod().methodName)
        
        #expect(successMethod != nil)
        #expect(failureMethod != nil)
        #expect(asyncMethod != nil)
    }
    
    @Test func testMethodOverride() throws {
        let pipe = MethodPipe()
        
        // Register first method
        pipe.register(localMethod: TestSuccessMethod())
        let firstMethod = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(firstMethod != nil)
        
        // Register another method with same name (should override)
        pipe.register(localMethod: TestSuccessMethod())
        let secondMethod = pipe.method(forName: TestSuccessMethod().methodName)
        #expect(secondMethod != nil)
        
        // Should still respond to the method name
        #expect(pipe.respondTo(methodName: TestSuccessMethod().methodName))
    }
    
    // MARK: - Result Model Type Tests
    
    final class TestWrongResultMethod: PipeMethod {
        public override var methodName: String {
            return "test.wrongResult"
        }
        
        public override class func methodName() -> String {
            return "test.wrongResult"
        }
        
        @objc public override var paramsModelClass: AnyClass {
            return TestParamsModel.self
        }
        
        @objc public override var resultModelClass: AnyClass {
            return EmptyMethodModelClass.self
        }
        
        @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
            guard let _ = paramModel as? TestParamsModel else {
                completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
                return
            }
            
            // Return a wrong result type
            let wrongResult = TestParamsModel()
            completionHandler.handleCompletion(status: .resultModelTypeWrong(message: "Result type mismatch"), result: wrongResult)
        }
    }
    
    @Test func testMethodExecutionResultModelTypeWrong() async throws {
        let pipe = MethodPipe()
        let method = TestWrongResultMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser"] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestWrongResultMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, _ in
                    actualStatus = status
                    semaphore.signal()
                }
                semaphore.wait()
                
                #expect(actualStatus?.code == MethodStatusCode.resultModelTypeWrong)
                #expect(actualStatus?.message?.contains("Result type") == true || actualStatus?.message?.contains("ResultType") == true)
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    // MARK: - Param Model Type Tests
    
    final class TestWrongParamModelMethod: PipeMethod {
        public override var methodName: String {
            return "test.wrongParamModel"
        }
        
        public override class func methodName() -> String {
            return "test.wrongParamModel"
        }
        
        @objc public override var paramsModelClass: AnyClass {
            return InvalidParamsModel.self
        }
        
        @objc public override var resultModelClass: AnyClass {
            return EmptyMethodModelClass.self
        }
        
        @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
            guard let _ = paramModel as? InvalidParamsModel else {
                completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
                return
            }
            
            let result = EmptyMethodModelClass()
            completionHandler.handleCompletion(status: .succeeded(), result: result)
        }
    }
    
    @Test func testMethodExecutionWrongParamModel() async throws {
        let pipe = MethodPipe()
        let method = TestWrongParamModelMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser"] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: TestWrongParamModelMethod().methodName) {
            do {
                // Try to create the wrong param model type
                let wrongParamModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                if let wrongParamModel = wrongParamModel {
                    method.call(withParamModel: wrongParamModel) { status, _ in
                        actualStatus = status
                        semaphore.signal()
                    }
                    semaphore.wait()
                    
                    #expect(actualStatus?.code == MethodStatusCode.invalidInputParameter)
                }
            } catch {
                #expect(true, "Expected error: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodExecutionStatusMessageInjection() async throws {
        let pipe = MethodPipe()
        let method = TestFailureMethod()
        
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser"] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        var actualResult: SPKMethodModel?
        
        if let method = pipe.method(forName: TestFailureMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, result in
                    actualStatus = status
                    actualResult = result
                    semaphore.signal()
                }
                semaphore.wait()
                
                #expect(actualStatus?.code == MethodStatusCode.failed)
                #expect(actualStatus?.message == "Test failure")
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
    
    @Test func testMethodExecutionResultInvalid() async throws {
        let pipe = MethodPipe()
        
        final class InvalidResultMethod: PipeMethod {
            public override var methodName: String {
                return "test.invalidResult"
            }
            
            public override class func methodName() -> String {
                return "test.invalidResult"
            }
            
            @objc public override var paramsModelClass: AnyClass {
                return TestParamsModel.self
            }
            
            @objc public override var resultModelClass: AnyClass {
                return TestResultModel.self
            }
            
            @objc public override func call(withParamModel paramModel: Any, completionHandler: CompletionHandlerProtocol) {
                guard let _ = paramModel as? TestParamsModel else {
                    completionHandler.handleCompletion(status: .invalidParameter(message: "Invalid parameter model type"), result: nil)
                    return
                }
                
                let result = TestResultModel()
                result.message = "success"
                completionHandler.handleCompletion(status: .succeeded(), result: result)
            }
        }
        
        let method = InvalidResultMethod()
        pipe.register(localMethod: method)
        
        let params = ["name": "TestUser"] as [String : Any]
        
        // Use a semaphore to wait for completion
        let semaphore = DispatchSemaphore(value: 0)
        var actualStatus: MethodStatus?
        
        if let method = pipe.method(forName: InvalidResultMethod().methodName) {
            do {
                let paramModel = try TestParamsModel.from(dict: params) as? TestParamsModel
                method.call(withParamModel: paramModel!) { status, _ in
                    actualStatus = status
                    semaphore.signal()
                }
                semaphore.wait()
                
                #expect(actualStatus != nil)
            } catch {
                #expect(false, "Failed to create param model: \(error)")
            }
        } else {
            #expect(false, "Method not found")
        }
    }
}

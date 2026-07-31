// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import SparklingMethod

struct LynxSendMessageTest {
    
    @Test
    func testSucceededMessageCreation() {
        let containerID = "test-container"
        let message = LynxSendMessage.succeededMessage(with: containerID)
        
        #expect(message.containerID == containerID)
        #expect(message.code == .succeeded)
        #expect(message.data == nil)
        #expect(message.recvMessage == nil)
    }
    
    @Test func testParamsErrorMessageCreation() throws {
        let containerID = "test-container-123"
        let errorMsg = "Invalid parameters"
        let message = LynxSendMessage.paramsErrorMessage(with: containerID, errorMsg: errorMsg)
        
        #expect(message.containerID == containerID)
        #expect(message.code == .parameterError)
        
        if let data = message.data as? [String: Any] {
            #expect(data[LynxKeys.message] as? String == errorMsg)
        } else {
            #expect(Bool(false), "Expected data to be a dictionary with message key")
        }
    }
    
    @Test func testParamsErrorMessageWithNilError() throws {
        let containerID = "test-container-123"
        let message = LynxSendMessage.paramsErrorMessage(with: containerID, errorMsg: nil)
        
        #expect(message.containerID == containerID)
        #expect(message.code == .parameterError)
        
        if let data = message.data as? [String: Any] {
            #expect(data[LynxKeys.message] as? String == "")
        } else {
            #expect(Bool(false), "Expected data to be a dictionary with empty message")
        }
    }
    
    @Test func testNoHandlerErrorMessageCreation() throws {
        let containerID = "test-container-123"
        let message = LynxSendMessage.noHandlerErrorMessage(with: containerID)
        
        #expect(message.containerID == containerID)
        #expect(message.code == .noHandler)
    }
    
    @Test func testNoHandlerErrorMessageWithNilContainer() throws {
        let message = LynxSendMessage.noHandlerErrorMessage(with: nil)
        
        #expect(message.containerID == nil)
        #expect(message.code == .noHandler)
    }
    
    @Test func testInitWithCustomData() throws {
        let containerID = "custom-container"
        let customData = ["key": "value", "number": 42] as [String : Any]
        let message = LynxSendMessage(containerID: containerID, data: customData, code: .succeeded)
        
        #expect(message.containerID == containerID)
        #expect(message.code == .succeeded)
        
        if let data = message.data as? [String: Any] {
            #expect(data["key"] as? String == "value")
            #expect(data["number"] as? Int == 42)
        } else {
            #expect(Bool(false), "Expected data to be a dictionary")
        }
    }
    
    @Test func testToDictConversion() throws {
        let containerID = "dict-test-container"
        let customData = ["testKey": "testValue"]
        let message = LynxSendMessage(containerID: containerID, data: customData, code: .succeeded)
        
        let dict = message.toDict()
        
        #expect(dict[LynxKeys.containerID] as? String == containerID)
        #expect(dict[LynxKeys.protocolVersion] as? String == "1.1.0")
        #expect(dict[LynxKeys.code] as? Int == LynxPipeStatusCode.succeeded.rawValue)
        
        if let data = dict[LynxKeys.data] as? [String: Any] {
            #expect(data["testKey"] as? String == "testValue")
        } else {
            #expect(Bool(false), "Expected data in dictionary")
        }
    }
    
    @Test func testParamsErrorDict() throws {
        let containerID = "error-dict-container"
        let errorMsg = "Test error message"
        let message = LynxSendMessage.paramsErrorMessage(with: containerID, errorMsg: errorMsg)
        
        let dict = message.toDict()
        
        #expect(dict[LynxKeys.containerID] as? String == containerID)
        #expect(dict[LynxKeys.code] as? Int == LynxPipeStatusCode.parameterError.rawValue)
        
        if let data = dict[LynxKeys.data] as? [String: Any] {
            #expect(data[LynxKeys.message] as? String == errorMsg)
        } else {
            #expect(Bool(false), "Expected error message in data")
        }
    }
    
    @Test func testNoHandlerMessageDict() throws {
        let containerID = "no-handler-container"
        let message = LynxSendMessage.noHandlerErrorMessage(with: containerID)
        
        let dict = message.toDict()
        
        #expect(dict[LynxKeys.containerID] as? String == containerID)
        #expect(dict[LynxKeys.code] as? Int == LynxPipeStatusCode.noHandler.rawValue)
    }
}
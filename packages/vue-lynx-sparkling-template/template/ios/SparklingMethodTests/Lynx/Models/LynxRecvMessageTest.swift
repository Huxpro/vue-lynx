// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import SparklingMethod

struct LynxRecvMessageTest {
    
    @Test func testBasicInitialization() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                "param1": "value1",
                "param2": 123
            ],
            LynxKeys.namespace: "testNamespace",
            LynxKeys.containerID: "container123",
            LynxKeys.protocolVersion: "2.0.0"
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.methodName == methodName)
        #expect(message.namescope == "testNamespace")
        #expect(message.containerID == "container123")
        #expect(message.protocolVersion == "2.0.0")
        
        if let data = message.data as? [String: Any] {
            #expect(data["param1"] as? String == "value1")
            #expect(data["param2"] as? Int == 123)
        } else {
            #expect(Bool(false), "Expected data to be a dictionary")
        }
    }
    
    @Test func testInitializationWithDefaultProtocolVersion() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: ["param1": "value1"]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.methodName == methodName)
        #expect(message.protocolVersion == "1.0.0")
        #expect(message.namescope == nil)
        #expect(message.containerID == nil)
    }
    
    @Test func testUseUIThreadFromDataLevel() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                LynxKeys.useUIThread: false
            ]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == false)
    }
    
    @Test func testUseUIThreadFromRawDataLevel() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.useUIThread: false
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == false)
    }
    
    @Test func testUseUIThreadPriorityDataOverRawData() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                "param1": "value1",
                LynxKeys.useUIThread: false
            ],
            LynxKeys.useUIThread: true
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == false)
    }
    
    @Test func testUseUIThreadDefaultValue() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: ["param1": "value1"]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == true)
    }
    
    @Test func testUseUIThreadTrueFromDataLevel() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                LynxKeys.useUIThread: true
            ]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == true)
    }
    
    @Test func testUseUIThreadTrueFromRawDataLevel() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.useUIThread: true
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == true)
    }
    
    @Test func testDataLevelPriorityOverRawDataLevel() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                LynxKeys.useUIThread: true
            ],
            LynxKeys.useUIThread: false
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == true)
    }
    
    @Test func testRawDataPreservation() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            "customKey": "customValue",
            LynxKeys.data: ["param1": "value1"]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.rawData["customKey"] as? String == "customValue")
        #expect(message.rawData.count == rawData.count)
    }
    
    @Test func testEmptyDataHandling() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [:]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.methodName == methodName)
        #expect(message.data == nil)
        #expect(message.namescope == nil)
        #expect(message.containerID == nil)
        #expect(message.protocolVersion == "1.0.0")
        #expect(message.useUIThread == true)
    }
    
    @Test func testDataAsNonDictionary() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: "not a dictionary"
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.data as? String == "not a dictionary")
        #expect(message.useUIThread == true) // Should use default value
    }
    
    @Test func testDataAsArray() throws {
        let methodName = "testMethod"
        let dataArray = ["item1", "item2"]
        let rawData: [String: Any] = [
            LynxKeys.data: dataArray
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.data as? [String] == dataArray)
        #expect(message.useUIThread == true) // Should use default value
    }
    
    @Test func testUseUIThreadWithNonBooleanValue() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.data: [
                LynxKeys.useUIThread: "false" // String instead of Bool
            ]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.useUIThread == true) // Should use default value when type mismatch
    }
    
    @Test func testProtocolVersionAsNonString() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.protocolVersion: 2.0 // Number instead of String
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.protocolVersion == "1.0.0") // Should use default value
    }
    
    @Test func testContainerIDAsNonString() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.containerID: 123 // Number instead of String
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.containerID == nil) // Should be nil when type mismatch
    }
    
    @Test func testNamespaceAsNonString() throws {
        let methodName = "testMethod"
        let rawData: [String: Any] = [
            LynxKeys.namespace: 456 // Number instead of String
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.namescope == nil) // Should be nil when type mismatch
    }
    
    @Test func testEmptyMethodName() throws {
        let methodName = ""
        let rawData: [String: Any] = [
            LynxKeys.data: ["param1": "value1"]
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        #expect(message.methodName == "")
        #expect(message.useUIThread == true)
    }
    
    @Test func testComplexDataStructure() throws {
        let methodName = "testMethod"
        let complexData: [String: Any] = [
            "nested": [
                "level1": [
                    "level2": "deep value"
                ]
            ],
            "array": [1, 2, 3],
            "mixed": ["string", 42, true]
        ]
        let rawData: [String: Any] = [
            LynxKeys.data: complexData
        ]
        
        let message = LynxRecvMessage(methodName: methodName, rawData: rawData)
        
        if let data = message.data as? [String: Any] {
            #expect(data["array"] as? [Int] == [1, 2, 3])
            if let nested = data["nested"] as? [String: Any],
               let level1 = nested["level1"] as? [String: Any] {
                #expect(level1["level2"] as? String == "deep value")
            } else {
                #expect(Bool(false), "Expected nested structure to be preserved")
            }
        } else {
            #expect(Bool(false), "Expected data to be a dictionary")
        }
    }
}
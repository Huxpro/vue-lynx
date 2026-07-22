// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling
import Lynx

struct SPKHybridContextTests {
    
    // MARK: - Helper Methods
    
    private func createTestContext() -> SPKHybridContext {
        let context = SPKHybridContext()
        context.globalProps = ["test": "value"]
        context.originURL = "https://example.com"
        context.pipeNameSpace = "testNamespace"
        return context
    }
    
    private func createEmptyContext() -> SPKHybridContext {
        return SPKHybridContext()
    }
    
    // MARK: - Dictionary Merge Tests
    
    @Test func testMergeWithDictOverride() {
        let dict1: [String: Any] = ["a": 1, "b": 2]
        let dict2: [String: Any] = ["b": 3, "c": 4]
        let merged = SPKHybridContext.merge(withDict: dict1, to: dict2, isOverride: true)
        #expect(merged?["a"] as? Int == 1)
        #expect(merged?["b"] as? Int == 2)
        #expect(merged?["c"] as? Int == 4)
    }
    
    @Test func testMergeWithDictNoOverride() {
        let dict1: [String: Any] = ["a": 1, "b": 2]
        let dict2: [String: Any] = ["b": 3, "c": 4]
        let merged = SPKHybridContext.merge(withDict: dict1, to: dict2, isOverride: false)
        #expect(merged?["a"] as? Int == 1)
        #expect(merged?["b"] as? Int == 3)
        #expect(merged?["c"] as? Int == 4)
    }
    
    @Test func testMergeWithNilDictionaries() {
        let dict1: [String: Any] = ["a": 1]
        let merged1 = SPKHybridContext.merge(withDict: dict1, to: nil, isOverride: true)
        let merged2 = SPKHybridContext.merge(withDict: nil, to: dict1, isOverride: true)
        let merged3 = SPKHybridContext.merge(withDict: nil, to: nil, isOverride: true)
        
        #expect(merged1 == nil)
        #expect(merged2 == nil)
        #expect(merged3 == nil)
    }
    
    @Test func testMergeWithEmptyDictionaries() {
        let dict1: [String: Any] = ["a": 1]
        let emptyDict: [String: Any] = [:]
        let merged1 = SPKHybridContext.merge(withDict: dict1, to: emptyDict, isOverride: true)
        let merged2 = SPKHybridContext.merge(withDict: emptyDict, to: dict1, isOverride: true)
        
        #expect(merged1?["a"] as? Int == 1)
        #expect(merged2?["a"] as? Int == 1)
    }
    
    // MARK: - Property Merge Tests
    
    @Test func testMergeWithPropOverride() {
        let source = "source"
        let target = "target"
        let merged1 = SPKHybridContext.merge(withProp: source, to: target, isOverride: true) as? String
        let merged2 = SPKHybridContext.merge(withProp: source, to: target, isOverride: false) as? String
        
        #expect(merged1 == source)
        #expect(merged2 == target)
    }
    
    @Test func testMergeWithNilProperties() {
        let source = "source"
        let merged1 = SPKHybridContext.merge(withProp: source, to: nil, isOverride: true) as? String
        let merged2 = SPKHybridContext.merge(withProp: nil, to: source, isOverride: true) as? String
        let merged3 = SPKHybridContext.merge(withProp: nil, to: nil, isOverride: true)
        
        #expect(merged1 == source)
        #expect(merged2 == source)
        #expect(merged3 == nil)
    }
    
    // MARK: - Array Merge Tests
    
    @Test func testMergeWithArrays() {
        let source = [1, 2, 3]
        let target = [4, 5]
        let merged = SPKHybridContext.merge(withArray: source, to: target) as? [Int]
        
        #expect(merged == [1, 2, 3, 4, 5])
    }
    
    @Test func testMergeWithNilArrays() {
        let source = [1, 2, 3]
        let merged1 = SPKHybridContext.merge(withArray: source, to: []) as? [Int]
        let merged2 = SPKHybridContext.merge(withArray: nil, to: source) as? [Int]
        let merged3 = SPKHybridContext.merge(withArray: nil, to: [])
        
        #expect(merged1 == source)
        #expect(merged2 == nil)
        #expect(merged3 == nil)
    }
    
    // MARK: - Context Merge Tests
    
    @Test func testMergeWithContextOverride() {
        let context1 = SPKHybridContext()
        context1.globalProps = ["key1": "value1"]
        context1.originURL = "url1"
        context1.pipeNameSpace = "ns1"
        
        let context2 = SPKHybridContext()
        context2.globalProps = ["key2": "value2"]
        context2.originURL = "url2"
        context2.pipeNameSpace = "ns2"
        
        context1.merge(withContext: context2, isOverride: true)
        
        let mergedGlobalProps = context1.globalProps as? [String: String]
        #expect(mergedGlobalProps?["key1"] == "value1")
        #expect(mergedGlobalProps?["key2"] == "value2")
        #expect(context1.originURL == "url2")
        #expect(context1.pipeNameSpace == "ns2")
    }
    
    @Test func testMergeWithContextNoOverride() {
        let context1 = SPKHybridContext()
        context1.globalProps = ["key1": "value1"]
        context1.originURL = "url1"
        context1.pipeNameSpace = "ns1"
        
        let context2 = SPKHybridContext()
        context2.globalProps = ["key2": "value2"]
        context2.originURL = "url2"
        context2.pipeNameSpace = "ns2"
        
        context1.merge(withContext: context2, isOverride: false)
        
        let mergedGlobalProps = context1.globalProps as? [String: String]
        #expect(mergedGlobalProps?["key1"] == "value1")
        #expect(mergedGlobalProps?["key2"] == "value2")
        #expect(context1.originURL == "url1")
        #expect(context1.pipeNameSpace == "ns1")
    }
    
    @Test func testMergeWithNilContext() {
        let context = createTestContext()
        let originalGlobalProps = context.globalProps as? [String: String]
        let originalURL = context.originURL
        let originalNamespace = context.pipeNameSpace
        
        context.merge(withContext: nil, isOverride: true)
        
        #expect((context.globalProps as? [String: String])?["test"] == originalGlobalProps?["test"])
        #expect(context.originURL == originalURL)
        #expect(context.pipeNameSpace == originalNamespace)
    }
    
    // MARK: - Copy Tests
    
    @Test func testCopyCreatesEqualCopy() {
        let context = createTestContext()
        context.engineType = .SPKHybridEngineTypeLynx
        context.queryItems = ["param": "value"]
        
        let copy = context.copy()
        guard let copy = copy as? SPKHybridContext else {
            #expect(Bool(false), "Copy should be SPKHybridContext")
            return
        }
        
        #expect(ObjectIdentifier(context) != ObjectIdentifier(copy))
        #expect((copy.globalProps as? [String: String])?["test"] == "value")
        #expect(copy.originURL == "https://example.com")
        #expect(copy.pipeNameSpace == "testNamespace")
        #expect(copy.engineType == .SPKHybridEngineTypeLynx)
    }
    
    @Test func testCopyWithEmptyContext() {
        let context = createEmptyContext()
        let copy = context.copy()
        
        guard let copy = copy as? SPKHybridContext else {
            #expect(Bool(false), "Copy should be SPKHybridContext")
            return
        }
        
        #expect(ObjectIdentifier(context) != ObjectIdentifier(copy))
        #expect(copy.globalProps == nil)
        #expect(copy.originURL == nil)
        #expect(copy.pipeNameSpace == "host")
    }
    
    // MARK: - Property Tests
    
    @Test func testDefaultValues() {
        let context = SPKHybridContext()
        
        #expect(context.engineType == .SPKHybridEngineTypeUnknown)
        #expect(context.globalProps == nil)
        #expect(context.queryItems == nil)
        #expect(context.pipeNameSpace == "host")
        #expect(context.schemeParams == nil)
        #expect(context.originURL == nil)
    }
    
    @Test func testPropertyAssignment() {
        let context = SPKHybridContext()
        
        context.engineType = .SPKHybridEngineTypeLynx
        context.globalProps = ["key": "value"]
        context.queryItems = ["param": "test"]
        context.pipeNameSpace = "custom"
        context.originURL = "https://test.com"
        
        #expect(context.engineType == .SPKHybridEngineTypeLynx)
        #expect((context.globalProps as? [String: String])?["key"] == "value")
        #expect((context.queryItems as? [String: String])?["param"] == "test")
        #expect(context.pipeNameSpace == "custom")
        #expect(context.originURL == "https://test.com")
    }
    
    // MARK: - Lynx Properties Tests
    
    @Test func testLynxProperties() {
        let context = SPKHybridContext()
        
        context.widthMode = NSNumber(value: 100)
        context.heightMode = NSNumber(value: 200)
        context.initialData = ["lynx": "data"]
        
        #expect(context.widthMode?.intValue == 100)
        #expect(context.heightMode?.intValue == 200)
        #expect((context.initialData as? [String: String])?["lynx"] == "data")
    }
    
    // MARK: - Edge Cases
    
    @Test func testComplexDataTypes() {
        let context = SPKHybridContext()
        let complexData: [String: Any] = [
            "string": "text",
            "number": 42,
            "array": [1, 2, 3],
            "nested": ["inner": "value"]
        ]
        
        context.globalProps = complexData
        
        guard let props = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be dictionary")
            return
        }
        
        #expect(props["string"] as? String == "text")
        #expect(props["number"] as? Int == 42)
        #expect((props["array"] as? [Int]) == [1, 2, 3])
        #expect((props["nested"] as? [String: String])?["inner"] == "value")
    }
    
    @Test func testMergeComplexGlobalProps() {
        let context1 = SPKHybridContext()
        context1.globalProps = ["level1": ["nested": "value1"]]
        
        let context2 = SPKHybridContext()
        context2.globalProps = ["level1": ["nested": "value2"], "level2": "new"]
        
        context1.merge(withContext: context2, isOverride: true)
        
        guard let props = context1.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be dictionary")
            return
        }
        
        #expect(props["level2"] as? String == "new")
    }
}

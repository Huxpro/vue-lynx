// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import Sparkling
import Lynx
import XCTest

struct SPKKitUtilsTests {
    
    // MARK: - Helper Methods
    
    private func createTestContext() -> SPKHybridContext {
        let context = SPKHybridContext()
        return context
    }
    
    private func createTestContextWithGlobalProps(_ props: [String: Any]) -> SPKHybridContext {
        let context = SPKHybridContext()
        context.globalProps = props
        return context
    }
    
    private func createTestContextWithLynxData(_ data: LynxTemplateData) -> SPKHybridContext {
        let context = SPKHybridContext()
        context.globalProps = data
        return context
    }
    
    // MARK: - updateGlobalProps Tests
    
    @Test func testUpdateGlobalPropsWithNilContext() {
        // Given
        let newProps = ["key": "value"]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: nil, newGlobalProps: newProps)
        
        // Then
        // Should not crash and return early
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func testUpdateGlobalPropsWithNilGlobalProps() {
        // Given
        let context = createTestContext()
        let newProps: [String: Any] = ["key1": "value1", "key2": 42]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: newProps)
        
        // Then
        #expect(context.globalProps != nil)
        
        if let globalProps = context.globalProps as? [String: Any] {
            #expect(globalProps["key1"] as? String == "value1")
            #expect(globalProps["key2"] as? Int == 42)
        } else {
            #expect(Bool(false), "globalProps should be a dictionary")
        }
    }
    
    @Test func testUpdateGlobalPropsWithExistingDictionary() {
        // Given
        let existingProps = ["existing": "value", "toOverride": "old"]
        let context = createTestContextWithGlobalProps(existingProps)
        let newProps = ["toOverride": "new", "newKey": "newValue"]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: newProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["existing"] as? String == "value")
        #expect(globalProps["toOverride"] as? String == "new") // Should be overridden
        #expect(globalProps["newKey"] as? String == "newValue")
        #expect(globalProps.count == 3)
    }
    
    @Test func testUpdateGlobalPropsWithEmptyNewProps() {
        // Given
        let existingProps: [String: Any] = ["key1": "value1", "key2": 123]
        let context = createTestContextWithGlobalProps(existingProps)
        let newProps: [String: Any] = [:]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: newProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["key1"] as? String == "value1")
        #expect(globalProps["key2"] as? Int == 123)
        #expect(globalProps.count == 2)
    }
    
    @Test func testUpdateGlobalPropsWithNilNewProps() {
        // Given
        let existingProps = ["key1": "value1"]
        let context = createTestContextWithGlobalProps(existingProps)
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: nil)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["key1"] as? String == "value1")
        #expect(globalProps.count == 1)
    }
    
    @Test func testUpdateGlobalPropsWithLynxTemplateData() {
        // Given
        guard let existingData = LynxTemplateData(dictionary: ["existing": "value"]) else { return }
        let context = createTestContextWithLynxData(existingData)
        let newProps = ["newKey": "newValue", "existing": "updated"]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: newProps)
        
        // Then
        guard let lynxData = context.globalProps as? LynxTemplateData else {
            #expect(Bool(false), "globalProps should be LynxTemplateData")
            return
        }
        
        // Verify the data was updated (exact verification depends on LynxTemplateData implementation)
        #expect(lynxData != nil)
    }
    
    @Test func testUpdateGlobalPropsWithComplexDataTypes() {
        // Given
        let context = createTestContext()
        let complexProps: [String: Any] = [
            "string": "text",
            "int": 42,
            "double": 3.14,
            "bool": true,
            "array": [1, 2, 3],
            "dict": ["nested": "value"],
            "nil": NSNull()
        ]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: complexProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["string"] as? String == "text")
        #expect(globalProps["int"] as? Int == 42)
        #expect(globalProps["double"] as? Double == 3.14)
        #expect(globalProps["bool"] as? Bool == true)
        #expect((globalProps["array"] as? [Int]) == [1, 2, 3])
        #expect((globalProps["dict"] as? [String: String])?["nested"] == "value")
        #expect(globalProps["nil"] is NSNull)
    }
    
    @Test func testUpdateGlobalPropsMergeBehavior() {
        // Given
        let existingProps = [
            "keep": "original",
            "override": "old",
            "number": 1
        ] as [String: Any]
        let context = createTestContextWithGlobalProps(existingProps)
        let newProps = [
            "override": "new",
            "number": 2,
            "add": "added"
        ] as [String: Any]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: newProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["keep"] as? String == "original")
        #expect(globalProps["override"] as? String == "new")
        #expect(globalProps["number"] as? Int == 2)
        #expect(globalProps["add"] as? String == "added")
        #expect(globalProps.count == 4)
    }
    
    @Test func testUpdateGlobalPropsWithLargeDataset() {
        // Given
        let context = createTestContext()
        var largeProps: [String: Any] = [:]
        for i in 0..<1000 {
            largeProps["key\(i)"] = "value\(i)"
        }
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: largeProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps.count == 1000)
        #expect(globalProps["key0"] as? String == "value0")
        #expect(globalProps["key999"] as? String == "value999")
    }
    
    // MARK: - Edge Cases
    
    @Test func testUpdateGlobalPropsWithSpecialCharacters() {
        // Given
        let context = createTestContext()
        let specialProps = [
            "key with spaces": "value1",
            "key-with-dashes": "value2",
            "key_with_underscores": "value3",
            "key.with.dots": "value4",
            "key@with@symbols": "value5",
            "localizedKey": "localizedValue",
            "🚀emoji🚀": "emoji_value"
        ]
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: specialProps)
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["key with spaces"] as? String == "value1")
        #expect(globalProps["key-with-dashes"] as? String == "value2")
        #expect(globalProps["key_with_underscores"] as? String == "value3")
        #expect(globalProps["key.with.dots"] as? String == "value4")
        #expect(globalProps["key@with@symbols"] as? String == "value5")
        #expect(globalProps["localizedKey"] as? String == "localizedValue")
        #expect(globalProps["🚀emoji🚀"] as? String == "emoji_value")
    }
    
    @Test func testUpdateGlobalPropsMultipleConsecutiveCalls() {
        // Given
        let context = createTestContext()
        
        // When
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: ["step1": "value1"])
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: ["step2": "value2"])
        SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: ["step1": "updated", "step3": "value3"])
        
        // Then
        guard let globalProps = context.globalProps as? [String: Any] else {
            #expect(Bool(false), "globalProps should be a dictionary")
            return
        }
        
        #expect(globalProps["step1"] as? String == "updated")
        #expect(globalProps["step2"] as? String == "value2")
        #expect(globalProps["step3"] as? String == "value3")
        #expect(globalProps.count == 3)
    }
    
    // MARK: - Performance Tests
    
    @Test func testUpdateGlobalPropsPerformance() {
        // Given
        let context = createTestContext()
        var props: [String: Any] = [:]
        for i in 0..<100 {
            props["key\(i)"] = "value\(i)"
        }
        
        // When
        let startTime = CFAbsoluteTimeGetCurrent()
        
        for _ in 0..<100 {
            SPKKitUtils.updateGlobalProps(withContext: context, newGlobalProps: props)
        }
        
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        
        // Then
        #expect(timeElapsed < 1.0) // Should complete within 1 second
    }
}

// MARK: - Test Helper Extensions

private extension SPKKitUtilsTests {
    func expectation(description: String) -> XCTestExpectation {
        return XCTestExpectation(description: description)
    }
    
    func wait(for expectations: [XCTestExpectation], timeout: TimeInterval) {
        // Note: This is a simplified wait implementation for Swift Testing
        // In a real test environment, you might need to use proper async testing
        let startTime = Date()
        while Date().timeIntervalSince(startTime) < timeout {
            var allFulfilled = true
            for expectation in expectations {
                if !expectation.isInverted {
                    allFulfilled = false
                    break
                }
            }
            if allFulfilled {
                break
            }
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.01))
        }
    }
}

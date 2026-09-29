// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKUtilsTests {
    @Test func testIsEmptyString() async throws {
        #expect(isEmptyString(nil) == true)
        #expect(isEmptyString("") == true)
        #expect(isEmptyString("Hello") == false)
        #expect(isEmptyString(123) == true)
    }
    
    @Test func testIsEmptyArray() async throws {
        #expect(isEmptyArray(nil) == true)
        #expect(isEmptyArray([]) == true)
        #expect(isEmptyArray([1, 2, 3]) == false)
        #expect(isEmptyArray("not an array") == true)
    }

    @Test func testIsEmptyDictionary() async throws {
        #expect(isEmptyDictionary(nil) == true)
        #expect(isEmptyDictionary([:]) == true)
        #expect(isEmptyDictionary(["key": "value"]) == false)
        #expect(isEmptyDictionary([1, 2, 3]) == true) // not a dictionary
    }
    
    @Test func testIsEmptyString_edgeCases() {
        // Test whitespace strings
        #expect(isEmptyString("   ") == false) // Spaces don't count as empty
        #expect(isEmptyString("\n") == false) // Newlines don't count as empty
        #expect(isEmptyString("\t") == false) // Tabs don't count as empty
        
        // Test different types
        #expect(isEmptyString(0) == true)
        #expect(isEmptyString(false) == true)
        #expect(isEmptyString(NSNull()) == true)
        #expect(isEmptyString(Date()) == true)
    }
    
    @Test func testIsEmptyString_nsStringTypes() {
        let nsString = NSString(string: "test")
        let emptyNSString = NSString(string: "")
        
        #expect(isEmptyString(nsString) == false)
        #expect(isEmptyString(emptyNSString) == true)
    }
    
    @Test func testIsEmptyArray_differentArrayTypes() {
        // Test different array types
        let stringArray: [String] = ["a", "b"]
        let intArray: [Int] = [1, 2, 3]
        let emptyStringArray: [String] = []
        let anyArray: [Any] = [1, "two", 3.0]
        
        #expect(isEmptyArray(stringArray) == false)
        #expect(isEmptyArray(intArray) == false)
        #expect(isEmptyArray(emptyStringArray) == true)
        #expect(isEmptyArray(anyArray) == false)
    }
    
    @Test func testIsEmptyArray_nsArrayTypes() {
        let nsArray = NSArray(array: [1, 2, 3])
        let emptyNSArray = NSArray()
        let mutableArray = NSMutableArray(array: ["a", "b"])
        let emptyMutableArray = NSMutableArray()
        
        #expect(isEmptyArray(nsArray) == false)
        #expect(isEmptyArray(emptyNSArray) == true)
        #expect(isEmptyArray(mutableArray) == false)
        #expect(isEmptyArray(emptyMutableArray) == true)
    }
    
    @Test func testIsEmptyArray_invalidTypes() {
        // Test non-array types
        #expect(isEmptyArray("string") == true)
        #expect(isEmptyArray(123) == true)
        #expect(isEmptyArray(["key": "value"]) == true) // Dictionary is not an array
        #expect(isEmptyArray(Set([1, 2, 3])) == true) // Set is not an array
    }
    
    @Test func testIsEmptyDictionary_differentDictionaryTypes() {
        // Test different dictionary types
        let stringDict: [String: String] = ["key": "value"]
        let intDict: [Int: String] = [1: "one", 2: "two"]
        let emptyStringDict: [String: String] = [:]
        let anyDict: [String: Any] = ["number": 42, "text": "hello"]
        
        #expect(isEmptyDictionary(stringDict) == false)
        #expect(isEmptyDictionary(intDict) == false)
        #expect(isEmptyDictionary(emptyStringDict) == true)
        #expect(isEmptyDictionary(anyDict) == false)
    }
    
    @Test func testIsEmptyDictionary_nsDictionaryTypes() {
        let nsDict = NSDictionary(dictionary: ["key": "value"])
        let emptyNSDict = NSDictionary()
        let mutableDict = NSMutableDictionary(dictionary: ["a": 1])
        let emptyMutableDict = NSMutableDictionary()
        
        #expect(isEmptyDictionary(nsDict) == false)
        #expect(isEmptyDictionary(emptyNSDict) == true)
        #expect(isEmptyDictionary(mutableDict) == false)
        #expect(isEmptyDictionary(emptyMutableDict) == true)
    }
    
    @Test func testIsEmptyDictionary_invalidTypes() {
        // Test non-dictionary types
        #expect(isEmptyDictionary("string") == true)
        #expect(isEmptyDictionary(123) == true)
        #expect(isEmptyDictionary([1, 2, 3]) == true) // Array is not a dictionary
        #expect(isEmptyDictionary(Set(["a", "b"])) == true) // Set is not a dictionary
    }
    
    @Test func testUtilityFunctions_consistency() {
        // Test function consistency
        let testValue: Any? = nil
        
        #expect(isEmptyString(testValue) == true)
        #expect(isEmptyArray(testValue) == true)
        #expect(isEmptyDictionary(testValue) == true)
    }
    
    @Test func testUtilityFunctions_performance() {
        // Test performance with large data
        let largeArray = Array(0..<10000)
        let largeDictionary = Dictionary(uniqueKeysWithValues: (0..<10000).map { ("key\($0)", $0) })
        let longString = String(repeating: "a", count: 10000)
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        #expect(isEmptyArray(largeArray) == false)
        #expect(isEmptyDictionary(largeDictionary) == false)
        #expect(isEmptyString(longString) == false)
        
        let endTime = CFAbsoluteTimeGetCurrent()
        let duration = endTime - startTime
        
        // Performance test: should complete in very short time
        #expect(duration < 0.01) // Should complete within 10ms
    }
}

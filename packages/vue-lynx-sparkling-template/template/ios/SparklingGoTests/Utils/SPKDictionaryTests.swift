// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKDictionaryTests {
    @Test func test_urlQueryString() async throws {
        let dict: [String: Any] = ["a": 1, "b": "test", "c": true]
        let query = dict.spk.urlQueryString
        #expect(query != nil)
        let parts = query!.split(separator: "&")
        #expect(parts.contains(where: { $0 == "a=1" }))
        #expect(parts.contains(where: { $0 == "b=test" }))
        #expect(parts.contains(where: { $0 == "c=true" }))
    }

    @Test func test_bool_forKey() async throws {
        let dict: [String: Any] = ["b1": true, "b2": NSNumber(value: 0), "b3": "true"]
        #expect(dict.spk.bool(forKey: "b1") == true)
        #expect(dict.spk.bool(forKey: "b2") == false)
        #expect(dict.spk.bool(forKey: "b3") == true) // NSString.boolValue supports "true"
        #expect(dict.spk.bool(forKey: "missing", default: true) == true)
    }

    @Test func test_int_forKey() async throws {
        let dict: [String: Any] = ["i1": 42, "i2": "123", "i3": "abc"]
        #expect(dict.spk.int(forKey: "i1") == 42)
        #expect(dict.spk.int(forKey: "i2") == 123)
        #expect(dict.spk.int(forKey: "i3", default: 9) == 0) // NSString.integerValue returns 0 for invalid string
    }

    @Test func test_float_and_double_forKey() async throws {
        let dict: [String: Any] = ["f": "3.14", "d": NSNumber(value: 2.718)]
        #expect(dict.spk.float(forKey: "f") == 3.14)
        #expect(dict.spk.double(forKey: "d") == 2.718)
    }

    @Test func test_string_forKey() async throws {
        let dict: [String: Any] = ["s": "hello", "n": NSNumber(value: 123)]
        #expect(dict.spk.string(forKey: "s") == "hello")
        #expect(dict.spk.string(forKey: "n") == "123")
        #expect(dict.spk.string(forKey: "missing") == nil)
        #expect(dict.spk.string(forKey: "missing", default: "default") == "default")
    }

    @Test func test_array_forKey() async throws {
        let dict: [String: Any] = ["arr": [1, 2, 3], "wrong": "not an array"]
        let array: [Int]? = dict.spk.array(forKey: "arr")
        #expect(array == [1, 2, 3])
        #expect(dict.spk.array(forKey: "wrong", default: [9, 9]) == [9, 9])
    }

    @Test func test_dictionary_forKey() async throws {
        let inner: [String: String] = ["x": "y"]
        let dict: [String: Any] = ["dict": inner]
        let result: [String: String]? = dict.spk.dictionary(forKey: "dict")
        #expect(result?["x"] == "y")
        let fallback = dict.spk.dictionary(forKey: "missing", default: ["k": "v"])
        #expect(fallback["k"] == "v")
    }

    @Test func test_object_forKey() async throws {
        let dict: [String: Any] = ["val": 999]
        let val: Int? = dict.spk.object(forKey: "val")
        #expect(val == 999)
        let missing: String = dict.spk.object(forKey: "nope", default: "default")
        #expect(missing == "default")
    }
    
    @Test func test_urlQueryString_emptyDictionary() {
        let emptyDict: [String: Any] = [:]
        let query = emptyDict.spk.urlQueryString
        #expect(query == "")
    }
    
    @Test func test_urlQueryString_specialCharacters() {
        let dict: [String: Any] = ["key with spaces": "value&with=special", "unicode": "sample"]
        let query = dict.spk.urlQueryString
        #expect(query != nil)
        #expect(query!.contains("%")) // Should contain URL encoding
    }
    
    @Test func test_urlQueryString_nilValues() {
        let dict: [String: Any?] = ["key1": "value1", "key2": nil, "key3": "value3"]
        let query = dict.spk.urlQueryString
        #expect(query != nil)
        // nil values should be ignored or handled
        #expect(!query!.contains("key2"))
    }
    
    @Test func test_bool_forKey_edgeCases() {
        let dict: [String: Any] = [
            "zero": 0,
            "one": 1,
            "yes": "YES",
            "no": "NO",
            "false_string": "false",
            "empty": "",
            "number_bool": NSNumber(value: true)
        ]
        
        #expect(dict.spk.bool(forKey: "zero") == false)
        #expect(dict.spk.bool(forKey: "one") == true)
        #expect(dict.spk.bool(forKey: "yes") == true)
        #expect(dict.spk.bool(forKey: "no") == false)
        #expect(dict.spk.bool(forKey: "false_string") == false)
        #expect(dict.spk.bool(forKey: "empty") == false)
        #expect(dict.spk.bool(forKey: "number_bool") == true)
    }
    
    @Test func test_int_forKey_boundaryValues() {
        let dict: [String: Any] = [
            "max_int": Int.max,
            "min_int": Int.min,
            "float_to_int": 3.14,
            "large_string": "999999999999999999999",
            "negative": "-42",
            "hex": "0xFF"
        ]
        
        #expect(dict.spk.int(forKey: "max_int") == Int.max)
        #expect(dict.spk.int(forKey: "min_int") == Int.min)
        #expect(dict.spk.int(forKey: "float_to_int") == 3)
        #expect(dict.spk.int(forKey: "negative") == -42)
        // hex strings may not be supported, depends on implementation
    }
    
    @Test func test_float_double_precision() {
        let dict: [String: Any] = [
            "pi": 3.141592653589793,
            "scientific": "1.23e-4",
            "infinity": Float.infinity,
            "nan": Float.nan
        ]
        
        let pi_float = dict.spk.float(forKey: "pi")
        #expect(abs(pi_float - 3.141593) < 0.000001)
        
        let scientific = dict.spk.double(forKey: "scientific")
        #expect(abs(scientific - 0.000123) < 0.0000001)
        
        let inf = dict.spk.float(forKey: "infinity")
        #expect(inf.isInfinite)
        
        let nan = dict.spk.float(forKey: "nan")
        #expect(nan.isNaN)
    }
    
    @Test func test_string_forKey_typeConversions() {
        let dict: [String: Any] = [
            "bool_true": true,
            "bool_false": false,
            "int": 42,
            "float": 3.14,
            "array": [1, 2, 3],
            "dict": ["key": "value"]
        ]
        
        #expect(dict.spk.string(forKey: "bool_true") == "1")
        #expect(dict.spk.string(forKey: "bool_false") == "0")
        #expect(dict.spk.string(forKey: "int") == "42")
        #expect(dict.spk.string(forKey: "float") == "3.14")
        // String conversion of arrays and dictionaries depends on implementation
    }
    
    @Test func test_array_forKey_typeValidation() {
        let dict: [String: Any] = [
            "string_array": ["a", "b", "c"],
            "mixed_array": [1, "two", 3.0],
            "empty_array": [],
            "not_array": "string"
        ]
        
        let stringArray: [String]? = dict.spk.array(forKey: "string_array")
        #expect(stringArray == ["a", "b", "c"])
        
        let mixedArray: [Any]? = dict.spk.array(forKey: "mixed_array")
        #expect(mixedArray?.count == 3)
        
        let emptyArray: [Int]? = dict.spk.array(forKey: "empty_array")
        #expect(emptyArray?.isEmpty == true)
        
        let notArray: [String]? = dict.spk.array(forKey: "not_array")
        #expect(notArray == nil)
    }
    
    @Test func test_dictionary_forKey_nestedStructures() {
        let nestedDict: [String: Any] = [
            "level1": [
                "level2": [
                    "level3": "deep_value"
                ]
            ],
            "empty_dict": [:],
            "not_dict": "string"
        ]
        
        let level1: [String: Any]? = nestedDict.spk.dictionary(forKey: "level1")
        #expect(level1 != nil)
        
        if let level1 = level1 {
            let level2: [String: Any]? = level1.spk.dictionary(forKey: "level2")
            #expect(level2 != nil)
            
            if let level2 = level2 {
                let value = level2.spk.string(forKey: "level3")
                #expect(value == "deep_value")
            }
        }
        
        let emptyDict: [String: String]? = nestedDict.spk.dictionary(forKey: "empty_dict")
        #expect(emptyDict?.isEmpty == true)
        
        let notDict: [String: String]? = nestedDict.spk.dictionary(forKey: "not_dict")
        #expect(notDict == nil)
    }
    
    @Test func test_object_forKey_genericTypes() {
        let dict: [String: Any] = [
            "date": Date(),
            "url": URL(string: "https://example.com")!,
            "data": Data([1, 2, 3, 4]),
            "custom_object": NSObject()
        ]
        
        let date: Date? = dict.spk.object(forKey: "date")
        #expect(date != nil)
        
        let url: URL? = dict.spk.object(forKey: "url")
        #expect(url?.absoluteString == "https://example.com")
        
        let data: Data? = dict.spk.object(forKey: "data")
        #expect(data?.count == 4)
        
        let customObject: NSObject? = dict.spk.object(forKey: "custom_object")
        #expect(customObject != nil)
    }

}

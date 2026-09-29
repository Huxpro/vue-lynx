// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import SparklingMethod

struct AnyCodableValueTest {
    
    @Test func testStringInitialization() throws {
        let value = AnyCodableValue("test")
        #expect(value != nil)
        if case .string(let str) = value! {
            #expect(str == "test")
        } else {
            #expect(Bool(false), "Expected string case")
        }
    }
    
    @Test func testIntInitialization() throws {
        let value = AnyCodableValue(42)
        #expect(value != nil)
        if case .int(let int) = value! {
            #expect(int == 42)
        } else {
            #expect(Bool(false), "Expected int case")
        }
    }
    
    @Test func testDoubleInitialization() throws {
        let value = AnyCodableValue(3.14)
        #expect(value != nil)
        if case .double(let double) = value! {
            #expect(double == 3.14)
        } else {
            #expect(Bool(false), "Expected double case")
        }
    }
    
    @Test func testBoolInitialization() throws {
        let value = AnyCodableValue(true)
        #expect(value != nil)
        if case .bool(let bool) = value! {
            #expect(bool == true)
        } else {
            #expect(Bool(false), "Expected bool case")
        }
    }
    
    @Test func testDictionaryInitialization() throws {
        let dict = ["key": "value"]
        let value = AnyCodableValue(dict)
        #expect(value != nil)
        if case .dictionary(let dictionary) = value! {
            if case .string(let stringValue) = dictionary["key"] {
                #expect(stringValue == "value")
            } else {
                #expect(Bool(false), "Expected string value for key")
            }
        } else {
            #expect(Bool(false), "Expected dictionary case")
        }
    }
    
    @Test func testArrayInitialization() throws {
        let array = [1, 2, 3]
        let value = AnyCodableValue(array)
        #expect(value != nil)
        if case .array(let arr) = value! {
            #expect(arr.count == 3)
            if case .int(let firstValue) = arr[0] {
                #expect(firstValue == 1)
            } else {
                #expect(Bool(false), "Expected int value at index 0")
            }
            if case .int(let secondValue) = arr[1] {
                #expect(secondValue == 2)
            } else {
                #expect(Bool(false), "Expected int value at index 1")
            }
            if case .int(let thirdValue) = arr[2] {
                #expect(thirdValue == 3)
            } else {
                #expect(Bool(false), "Expected int value at index 2")
            }
        } else {
            #expect(Bool(false), "Expected array case")
        }
    }
    
    @Test func testUnsupportedTypeInitialization() throws {
        let unsupported = Date()
        let value = AnyCodableValue(unsupported)
        #expect(value == nil)
    }
    
    @Test func testAnyValueProperty() throws {
        let stringValue = AnyCodableValue("test")
        #expect(stringValue?.anyValue as? String == "test")
        
        let intValue = AnyCodableValue(42)
        #expect(intValue?.anyValue as? Int == 42)
        
        let dictValue = AnyCodableValue(["key": "value"])
        let dict = dictValue?.anyValue as? [String: Any]
        #expect(dict?["key"] as? String == "value")
    }
    
    @Test func testGetMethod() throws {
        let dict = ["nested": ["key": "value"]]
        let value = AnyCodableValue(dict)
        
        // Test getting the dictionary value and accessing nested elements
        if case .dictionary(let dictValue) = value {
            let nestedValue = dictValue["nested"]
            #expect(nestedValue != nil)
            
            if case .dictionary(let nestedDict) = nestedValue {
                let finalValue = nestedDict["key"]
                #expect(finalValue?.anyValue as? String == "value")
            } else {
                #expect(Bool(false), "Expected nested dictionary")
            }
            
            let nonExistentValue = dictValue["nonexistent"]
            #expect(nonExistentValue == nil)
        } else {
            #expect(Bool(false), "Expected dictionary case")
        }
    }
    
    @Test func testDictionaryValue() throws {
        let dict = ["key": "value"]
        let value = AnyCodableValue(dict)
        
        let dictionaryValue: [String: String]? = value?.dictionaryValue()
        #expect(dictionaryValue != nil)
        #expect(dictionaryValue?["key"] == "value")
        
        let stringValue = AnyCodableValue("test")
        let stringDictValue: [String: String]? = stringValue?.dictionaryValue()
        #expect(stringDictValue == nil)
    }
    
    @Test func testArrayValue() throws {
        let array = [1, 2, 3]
        let value = AnyCodableValue(array)
        
        let arrayValue: [Int]? = value?.arrayValue()
        #expect(arrayValue != nil)
        #expect(arrayValue?.count == 3)
        #expect(arrayValue?[0] == 1)
        
        let stringValue = AnyCodableValue("test")
        let stringArrayValue: [Int]? = stringValue?.arrayValue()
        #expect(stringArrayValue == nil)
    }
    
    @Test func testCodableEncoding() throws {
        let dict = ["name": "John", "age": 30] as [String: Any]
        let value = AnyCodableValue(dict)
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(value)
        #expect(data.count > 0)
        
        let decoder = JSONDecoder()
        let decodedValue = try decoder.decode(AnyCodableValue.self, from: data)
        
        if case .dictionary(let decodedDict) = decodedValue {
            if case .string(let nameValue) = decodedDict["name"] {
                #expect(nameValue == "John")
            } else {
                #expect(Bool(false), "Expected string value for name")
            }
            if case .int(let ageValue) = decodedDict["age"] {
                #expect(ageValue == 30)
            } else {
                #expect(Bool(false), "Expected int value for age")
            }
        } else {
            #expect(Bool(false), "Expected dictionary case after decoding")
        }
    }
    
    @Test func testCodableDecodingError() throws {
        let invalidJSON = "invalid json".data(using: .utf8)!
        let decoder = JSONDecoder()
        
        #expect(throws: DecodingError.self) {
            try decoder.decode(AnyCodableValue.self, from: invalidJSON)
        }
    }
    
    // MARK: - Additional tests for better coverage
    
    @Test func testGetMethodWithAllTypes() throws {
        // Test get<T>() method with all supported types
        let stringValue = AnyCodableValue("test")
        let retrievedString: String? = stringValue?.get()
        #expect(retrievedString == "test")
        
        let intValue = AnyCodableValue(42)
        let retrievedInt: Int? = intValue?.get()
        #expect(retrievedInt == 42)
        
        let doubleValue = AnyCodableValue(3.14)
        let retrievedDouble: Double? = doubleValue?.get()
        #expect(retrievedDouble == 3.14)
        
        let boolValue = AnyCodableValue(true)
        let retrievedBool: Bool? = boolValue?.get()
        #expect(retrievedBool == true)
        
        let dictValue = AnyCodableValue(["key": "value"])
        let retrievedDict: [String: AnyCodableValue]? = dictValue?.get()
        #expect(retrievedDict != nil)
        
        let arrayValue = AnyCodableValue([1, 2, 3])
        let retrievedArray: [AnyCodableValue]? = arrayValue?.get()
        #expect(retrievedArray != nil)
    }
    
    @Test func testGetMethodWithWrongType() throws {
        // Test get<T>() method with wrong type casting
        let stringValue = AnyCodableValue("test")
        let wrongInt: Int? = stringValue?.get()
        #expect(wrongInt == nil)
        
        let intValue = AnyCodableValue(42)
        let wrongString: String? = intValue?.get()
        #expect(wrongString == nil)
        
        let dictValue = AnyCodableValue(["key": "value"])
        let wrongArray: [AnyCodableValue]? = dictValue?.get()
        #expect(wrongArray == nil)
    }
    
    @Test func testFloatInitialization() throws {
        // Test Float type - should return nil as Float is not directly supported
        let floatValue: Float = 2.5
        let value = AnyCodableValue(floatValue)
        #expect(value == nil)
        
        // Test Float converted to Double - should work
        let doubleFromFloat = Double(floatValue)
        let valueFromDouble = AnyCodableValue(doubleFromFloat)
        #expect(valueFromDouble != nil)
        if case .double(let double) = valueFromDouble! {
            #expect(abs(double - 2.5) < 0.001)
        } else {
            #expect(Bool(false), "Expected double case for Float converted to Double")
        }
    }
    
    @Test func testEmptyCollections() throws {
        // Test empty dictionary
        let emptyDict: [String: Any] = [:]
        let dictValue = AnyCodableValue(emptyDict)
        #expect(dictValue != nil)
        if case .dictionary(let dict) = dictValue! {
            #expect(dict.isEmpty)
        } else {
            #expect(Bool(false), "Expected dictionary case")
        }
        
        // Test empty array
        let emptyArray: [Any] = []
        let arrayValue = AnyCodableValue(emptyArray)
        #expect(arrayValue != nil)
        if case .array(let arr) = arrayValue! {
            #expect(arr.isEmpty)
        } else {
            #expect(Bool(false), "Expected array case")
        }
    }
    
    @Test func testDictionaryWithUnsupportedValues() throws {
        // Test dictionary containing unsupported types
        let dictWithUnsupported = ["valid": "string", "invalid": Date()] as [String: Any]
        let value = AnyCodableValue(dictWithUnsupported)
        #expect(value != nil)
        if case .dictionary(let dict) = value! {
            #expect(dict["valid"] != nil)
            #expect(dict["invalid"] == nil) // Unsupported type should be filtered out
            #expect(dict.count == 1)
        } else {
            #expect(Bool(false), "Expected dictionary case")
        }
    }
    
    @Test func testArrayWithUnsupportedValues() throws {
        // Test array containing unsupported types
        let arrayWithUnsupported: [Any] = ["string", 42, Date(), true]
        let value = AnyCodableValue(arrayWithUnsupported)
        #expect(value != nil)
        if case .array(let arr) = value! {
            #expect(arr.count == 3) // Date should be filtered out
            if case .string(let str) = arr[0] {
                #expect(str == "string")
            } else {
                #expect(Bool(false), "Expected string at index 0")
            }
            if case .int(let int) = arr[1] {
                #expect(int == 42)
            } else {
                #expect(Bool(false), "Expected int at index 1")
            }
            if case .bool(let bool) = arr[2] {
                #expect(bool == true)
            } else {
                #expect(Bool(false), "Expected bool at index 2")
            }
        } else {
            #expect(Bool(false), "Expected array case")
        }
    }
    
    @Test func testComplexNestedStructure() throws {
        // Test complex nested structure with mixed types
        let complexData: [String: Any] = [
            "user": [
                "name": "John",
                "age": 30,
                "active": true,
                "scores": [85.5, 92.0, 78.5]
            ],
            "metadata": [
                "version": "1.0",
                "tags": ["important", "user-data"]
            ]
        ]
        
        let value = AnyCodableValue(complexData)
        #expect(value != nil)
        
        if case .dictionary(let rootDict) = value! {
            // Test user object
            if case .dictionary(let userDict) = rootDict["user"] {
                if case .string(let name) = userDict["name"] {
                    #expect(name == "John")
                } else {
                    #expect(Bool(false), "Expected string name")
                }
                
                if case .int(let age) = userDict["age"] {
                    #expect(age == 30)
                } else {
                    #expect(Bool(false), "Expected int age")
                }
                
                if case .bool(let active) = userDict["active"] {
                    #expect(active == true)
                } else {
                    #expect(Bool(false), "Expected bool active")
                }
                
                if case .array(let scores) = userDict["scores"] {
                    #expect(scores.count == 3)
                    if case .double(let firstScore) = scores[0] {
                        #expect(firstScore == 85.5)
                    } else {
                        #expect(Bool(false), "Expected double score")
                    }
                } else {
                    #expect(Bool(false), "Expected array scores")
                }
            } else {
                #expect(Bool(false), "Expected dictionary user")
            }
            
            // Test metadata object
            if case .dictionary(let metaDict) = rootDict["metadata"] {
                if case .string(let version) = metaDict["version"] {
                    #expect(version == "1.0")
                } else {
                    #expect(Bool(false), "Expected string version")
                }
                
                if case .array(let tags) = metaDict["tags"] {
                    #expect(tags.count == 2)
                    if case .string(let firstTag) = tags[0] {
                        #expect(firstTag == "important")
                    } else {
                        #expect(Bool(false), "Expected string tag")
                    }
                } else {
                    #expect(Bool(false), "Expected array tags")
                }
            } else {
                #expect(Bool(false), "Expected dictionary metadata")
            }
        } else {
            #expect(Bool(false), "Expected dictionary case")
        }
    }
    
    @Test func testDictionaryValueWithMixedTypes() throws {
        // Test dictionaryValue with mixed value types
        let mixedDict = ["string": "value", "number": 42] as [String: Any]
        let value = AnyCodableValue(mixedDict)
        
        // Test extracting only strings
        let stringDict: [String: String]? = value?.dictionaryValue()
        #expect(stringDict != nil)
        #expect(stringDict?["string"] == "value")
        #expect(stringDict?["number"] == nil) // Should be filtered out
        
        // Test extracting only integers
        let intDict: [String: Int]? = value?.dictionaryValue()
        #expect(intDict != nil)
        #expect(intDict?["number"] == 42)
        #expect(intDict?["string"] == nil) // Should be filtered out
    }
    
    @Test func testArrayValueWithMixedTypes() throws {
        // Test arrayValue with mixed element types
        let mixedArray: [Any] = ["string", 42, "another", 99]
        let value = AnyCodableValue(mixedArray)
        
        // Test extracting only strings
        let stringArray: [String]? = value?.arrayValue()
        #expect(stringArray != nil)
        #expect(stringArray?.count == 2)
        #expect(stringArray?[0] == "string")
        #expect(stringArray?[1] == "another")
        
        // Test extracting only integers
        let intArray: [Int]? = value?.arrayValue()
        #expect(intArray != nil)
        #expect(intArray?.count == 2)
        #expect(intArray?[0] == 42)
        #expect(intArray?[1] == 99)
    }
    
    @Test func testAnyValueWithComplexStructure() throws {
        // Test anyValue property with complex nested structure
        let nestedData = [
            "level1": [
                "level2": [
                    "values": [1, 2, 3]
                ]
            ]
        ] as [String: Any]
        
        let value = AnyCodableValue(nestedData)
        let anyValue = value?.anyValue as? [String: Any]
        #expect(anyValue != nil)
        
        let level1 = anyValue?["level1"] as? [String: Any]
        #expect(level1 != nil)
        
        let level2 = level1?["level2"] as? [String: Any]
        #expect(level2 != nil)
        
        let values = level2?["values"] as? [Int]
        #expect(values != nil)
        #expect(values?.count == 3)
        #expect(values?[0] == 1)
    }
    
    @Test func testEncodingAllTypes() throws {
        // Test encoding each type individually
        let encoder = JSONEncoder()
        
        // String
        let stringValue = AnyCodableValue("test")
        let stringData = try encoder.encode(stringValue)
        #expect(stringData.count > 0)
        
        // Int
        let intValue = AnyCodableValue(42)
        let intData = try encoder.encode(intValue)
        #expect(intData.count > 0)
        
        // Double
        let doubleValue = AnyCodableValue(3.14)
        let doubleData = try encoder.encode(doubleValue)
        #expect(doubleData.count > 0)
        
        // Bool
        let boolValue = AnyCodableValue(true)
        let boolData = try encoder.encode(boolValue)
        #expect(boolData.count > 0)
        
        // Array
        let arrayValue = AnyCodableValue([1, 2, 3])
        let arrayData = try encoder.encode(arrayValue)
        #expect(arrayData.count > 0)
    }
    
    @Test func testDecodingAllTypes() throws {
        // Test decoding each type individually
        let decoder = JSONDecoder()
        
        // String
        let stringJSON = "\"test\"".data(using: .utf8)!
        let stringValue = try decoder.decode(AnyCodableValue.self, from: stringJSON)
        if case .string(let str) = stringValue {
            #expect(str == "test")
        } else {
            #expect(Bool(false), "Expected string case")
        }
        
        // Int
        let intJSON = "42".data(using: .utf8)!
        let intValue = try decoder.decode(AnyCodableValue.self, from: intJSON)
        if case .int(let int) = intValue {
            #expect(int == 42)
        } else {
            #expect(Bool(false), "Expected int case")
        }
        
        // Double
        let doubleJSON = "3.14".data(using: .utf8)!
        let doubleValue = try decoder.decode(AnyCodableValue.self, from: doubleJSON)
        if case .double(let double) = doubleValue {
            #expect(double == 3.14)
        } else {
            #expect(Bool(false), "Expected double case")
        }
        
        // Bool
        let boolJSON = "true".data(using: .utf8)!
        let boolValue = try decoder.decode(AnyCodableValue.self, from: boolJSON)
        if case .bool(let bool) = boolValue {
            #expect(bool == true)
        } else {
            #expect(Bool(false), "Expected bool case")
        }
        
        // Array
        let arrayJSON = "[1,2,3]".data(using: .utf8)!
        let arrayValue = try decoder.decode(AnyCodableValue.self, from: arrayJSON)
        if case .array(let arr) = arrayValue {
            #expect(arr.count == 3)
        } else {
            #expect(Bool(false), "Expected array case")
        }
    }
    
    @Test func testDecodingUnsupportedType() throws {
        // Test decoding unsupported JSON structure
        let nullJSON = "null".data(using: .utf8)!
        let decoder = JSONDecoder()
        
        #expect(throws: DecodingError.self) {
            try decoder.decode(AnyCodableValue.self, from: nullJSON)
        }
    }
}

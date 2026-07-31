// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKStringTests {
    @Test func testUrlEncoded() async throws {
        let input = "a=1&b=2"
        let encoded = input.spk.urlEncoded
        #expect(encoded! == "a%3D1%26b%3D2")
    }
    
    @Test func testQueryString_fromURLWithQuery() async throws {
        let input = "https://example.com/path?name=John&age=30"
        let query = input.spk.queryString()
        #expect(query == "name=John&age=30")
    }
    
    @Test func testQueryString_fromURLWithoutQuery() async throws {
        let input = "https://example.com/path"
        let query = input.spk.queryString()
        #expect(query == nil)
    }
    
    @Test func testQueryDict_basic() async throws {
        let input = "https://example.com/path?key1=value1&key2=value2"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["key1"] == "value1")
        #expect(dict?["key2"] == "value2")
    }

    @Test func testQueryDict_withEncoding() async throws {
        let input = "https://example.com/path?key1=hello%20world&key2=swift"
        let dict = input.spk.queryDict(isEscapes: true)
        #expect(dict?["key1"] == "hello world")
        #expect(dict?["key2"] == "swift")
    }

    @Test func testQueryDict_incompleteKeyValue() async throws {
        let input = "https://example.com/path?key1=&=value2"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict == nil)
    }
    
    @Test func testUrlEncoded_specialCharacters() {
        let input = "Hello World!@#$%^&*()_+-={}[]|\\:;\"'<>?,./ "
        let encoded = input.spk.urlEncoded
        #expect(encoded != nil)
        #expect(encoded!.contains("%"))
        #expect(!encoded!.contains(" "))
        #expect(!encoded!.contains("!"))
    }
    
    @Test func testUrlEncoded_unicodeCharacters() {
        let input = "hello 🌍"
        let encoded = input.spk.urlEncoded
        #expect(encoded != nil)
        #expect(encoded!.contains("%"))
        #expect(!encoded!.contains("🌍"))
    }
    
    @Test func testUrlEncoded_emptyString() {
        let input = ""
        let encoded = input.spk.urlEncoded
        #expect(encoded == "")
    }
    
    @Test func testUrlEncoded_alreadyEncoded() {
        let input = "hello%20world"
        let encoded = input.spk.urlEncoded
        // Should re-encode already encoded strings
        #expect(encoded != nil)
        #expect(encoded!.contains("%25"))
    }
    
    @Test func testQueryString_complexURL() {
        let input = "https://api.example.com/v1/users?id=123&name=John%20Doe&active=true&tags=swift,ios,mobile"
        let query = input.spk.queryString()
        #expect(query == "id=123&name=John%20Doe&active=true&tags=swift,ios,mobile")
    }
    
    @Test func testQueryString_invalidURL() {
        let input = "not a url"
        let query = input.spk.queryString()
        #expect(query == nil)
    }
    
    @Test func testQueryDict_duplicateKeys() {
        let input = "https://example.com/path?key=value1&key=value2"
        let dict = input.spk.queryDict(isEscapes: false)
        // Depends on implementation, may keep last or first value
        #expect(dict?["key"] != nil)
    }
    
    @Test func testQueryDict_specialCharactersInValues() {
        let input = "https://example.com/path?message=hello%2Bworld&symbol=%26%3D%25"
        let dict = input.spk.queryDict(isEscapes: true)
        #expect(dict?["message"] == "hello+world")
        #expect(dict?["symbol"] == "&=%")
    }
    
    @Test func testQueryDict_booleanValues() {
        let input = "https://example.com/path?active=true&disabled=false&empty="
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["active"] == "true")
        #expect(dict?["disabled"] == "false")
        #expect(dict?["empty"] == nil)
    }
    
    @Test func testQueryDict_numericValues() {
        let input = "https://example.com/path?count=42&price=19.99&negative=-5"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["count"] == "42")
        #expect(dict?["price"] == "19.99")
        #expect(dict?["negative"] == "-5")
    }
    
    @Test func testQueryDict_arrayLikeValues() {
        let input = "https://example.com/path?tags=swift,ios,mobile&ids=1,2,3,4"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["tags"] == "swift,ios,mobile")
        #expect(dict?["ids"] == "1,2,3,4")
    }
    
    @Test func testQueryDict_withoutEscapes_specialChars() {
        let input = "https://example.com/path?key1=hello%20world&key2=test%2Bvalue"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["key1"] == "hello%20world")
        #expect(dict?["key2"] == "test%2Bvalue")
    }
    
    @Test func testQueryDict_malformedQuery() {
        let input = "https://example.com/path?key1&key2=value2&=&key3="
        let dict = input.spk.queryDict(isEscapes: false)
        // Depends on implementation's fault tolerance
        if let dict = dict {
            #expect(dict["key2"] == "value2")
            #expect(dict["key3"] == nil)
        }
    }
    
    @Test func testQueryDict_longValues() {
        let longValue = String(repeating: "a", count: 1000)
        let input = "https://example.com/path?data=\(longValue)"
        let dict = input.spk.queryDict(isEscapes: false)
        #expect(dict?["data"]?.count == 1000)
    }
    
    @Test func testQueryString_edgeCases() {
        // Test various edge cases
        let testCases = [
            "https://example.com",
            "https://example.com/",
            "https://example.com/path",
            "https://example.com/path/",
            "https://example.com/path??",
            "https://example.com/path?#fragment"
        ]
        
        for testCase in testCases {
            let query = testCase.spk.queryString()
            // Verify result is reasonable (nil or valid string)
            if let query = query {
                #expect(!query.hasPrefix("?"))
            }
        }
    }
}

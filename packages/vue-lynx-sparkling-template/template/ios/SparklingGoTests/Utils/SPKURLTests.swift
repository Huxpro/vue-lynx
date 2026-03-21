// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKURLTests {
    @Test func testUrlConstruction_basic() async throws {
        let url = URL.spk.url(string: "https://example.com/path?name=John&age=18")
        #expect(url != nil)
        #expect(url?.absoluteString.contains("name=John") == true)
        #expect(url?.absoluteString.contains("age=18") == true)
    }

    @Test func testUrlConstruction_withQueryItems() async throws {
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: ["name": "John", "age": 30]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("name=John"))
        #expect(url!.absoluteString.contains("age=30"))
    }

    @Test func testUrlConstruction_withFragment() async throws {
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: ["page": "1"],
            fragment: "section1"
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("#section1"))
    }

    @Test func testQueryItems_raw() async throws {
        let url = URL(string: "https://example.com/path?a=1&b=2")!
        let query = url.spk.queryItems
        #expect(query?["a"] == "1")
        #expect(query?["b"] == "2")
    }

    @Test func testDecodedQueryItems() async throws {
        let url = URL(string: "https://example.com/path?name=John%20Doe&lang=en")!
        let decoded = url.spk.decodedQueryItems
        #expect(decoded?["name"] == "John Doe")
        #expect(decoded?["lang"] == "en")
    }

    @Test func testUrlConstruction_withEmptyInput() async throws {
        let url = URL.spk.url(string: "")
        #expect(url == nil)
    }

    @Test func testUrlConstruction_withRelativeURL() async throws {
        let base = URL(string: "https://example.com/")!
        let relative = URL.spk.url(string: "api/v1/items?id=10", relativeTo: base)
        #expect(relative != nil)
        #expect(relative!.absoluteString.contains("api/v1/items"))
        #expect(relative!.absoluteString.contains("id=10"))
    }
    
    @Test func testUrlConstruction_specialCharacters() {
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: ["message": "Hello World!", "symbol": "@#$%"]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("%")) // Should contain URL encoding
    }
    
    @Test func testUrlConstruction_unicodeCharacters() {
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: ["greeting": "hello world", "emoji": "🌍"]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("%")) // Unicode characters should be encoded
    }
    
    @Test func testUrlConstruction_emptyQueryItems() {
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: [:]
        )
        #expect(url != nil)
        #expect(url!.absoluteString == "https://example.com/path")
    }
    
    @Test func testUrlConstruction_withExistingQuery() {
        let url = URL.spk.url(
            string: "https://example.com/path?existing=param",
            queryItems: ["new": "value"]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("existing=param"))
        #expect(url!.absoluteString.contains("new=value"))
    }
    
    @Test func testUrlConstruction_fragmentOnly() {
        let url = URL.spk.url(
            string: "https://example.com/path",
            fragment: "section1"
        )
        #expect(url != nil)
        #expect(url!.absoluteString.hasSuffix("#section1"))
    }
    
    @Test func testQueryItems_emptyQuery() {
        let url = URL(string: "https://example.com/path")!
        let query = url.spk.queryItems
        #expect(query == nil)
    }
    
    @Test func testQueryItems_duplicateKeys() {
        let url = URL(string: "https://example.com/path?key=value1&key=value2")!
        let query = url.spk.queryItems
        #expect(query?["key"] != nil) // Should have value, which one depends on implementation
    }
    
    @Test func testQueryItems_specialCharacters() {
        let url = URL(string: "https://example.com/path?message=hello%20world&symbol=%26%3D")!
        let query = url.spk.queryItems
        #expect(query?["message"] == "hello%20world") // Raw encoded value
        #expect(query?["symbol"] == "%26%3D")
    }
    
    @Test func testDecodedQueryItems_emptyQuery() {
        let url = URL(string: "https://example.com/path")!
        let decoded = url.spk.decodedQueryItems
        #expect(decoded == nil)
    }
    
    @Test func testDecodedQueryItems_complexEncoding() {
        let url = URL(string: "https://example.com/path?message=hello%2Bworld&data=%7B%22key%22%3A%22value%22%7D")!
        let decoded = url.spk.decodedQueryItems
        #expect(decoded?["message"] == "hello+world")
        #expect(decoded?["data"] == "{\"key\":\"value\"}")
    }
    
    @Test func testDecodedQueryItems_unicodeCharacters() {
        let url = URL(string: "https://example.com/path?greeting=hello%20world&emoji=%F0%9F%8C%8D")!
        let decoded = url.spk.decodedQueryItems
        #expect(decoded?["greeting"] == "hello world")
        #expect(decoded?["emoji"] == "🌍")
    }
    
    @Test func testUrlConstruction_largeQueryItems() {
        let largeValue = String(repeating: "a", count: 1000)
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: ["data": largeValue]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("data="))
    }
    
    @Test func testUrlConstruction_manyQueryItems() {
        var queryItems: [String: Any] = [:]
        for i in 0..<100 {
            queryItems["key\(i)"] = "value\(i)"
        }
        
        let url = URL.spk.url(
            string: "https://example.com/path",
            queryItems: queryItems
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains("key0=value0"))
        #expect(url!.absoluteString.contains("key99=value99"))
    }
    
    @Test func testUrlConstruction_withPort() {
        let url = URL.spk.url(
            string: "https://example.com:8080/path",
            queryItems: ["test": "value"]
        )
        #expect(url != nil)
        #expect(url!.absoluteString.contains(":8080"))
        #expect(url!.absoluteString.contains("test=value"))
    }
}

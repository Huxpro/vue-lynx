// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKHybridSchemeParamTests {
    
    // MARK: - Initialization Tests
    
    @Test func testInitWithValidDictionary() async throws {
        let dict: [String: Any] = ["url": "https://example.com/page?foo=bar"]
        let param = SPKHybridSchemeParam(withDictionary: dict)
        
        #expect(param.extra["url"] as? String == "https://example.com/page?foo=bar")
        #expect(param.url == "https://example.com/page?foo=bar")
        #expect(param.engineType == .SPKHybridEngineTypeUnknown)
        #expect(param.originURL == nil)
        #expect(param.resolvedURL == nil)
    }
    
    @Test func testInitWithNilDictionary() async throws {
        let param = SPKHybridSchemeParam(withDictionary: nil)
        
        #expect(param.extra.isEmpty)
        #expect(param.url == nil)
        #expect(param.engineType == .SPKHybridEngineTypeUnknown)
        #expect(param.originURL == nil)
        #expect(param.resolvedURL == nil)
    }
    
    @Test func testInitWithEmptyDictionary() async throws {
        let param = SPKHybridSchemeParam(withDictionary: [:])
        
        #expect(param.extra.isEmpty)
        #expect(param.url == nil)
        #expect(param.engineType == .SPKHybridEngineTypeUnknown)
    }
    
    @Test func testInitWithComplexDictionary() async throws {
        let dict: [String: Any] = [
            "url": "https://example.com?param1=value1&param2=value2",
            "bundle": "test.bundle",
            "extra_param": "extra_value"
        ]
        let param = SPKHybridSchemeParam(withDictionary: dict)
        
        #expect(param.url == "https://example.com?param1=value1&param2=value2")
        #expect(param.extra["bundle"] as? String == "test.bundle")
        #expect(param.extra["extra_param"] as? String == "extra_value")
    }
    
    // MARK: - Update Tests
    
    @Test func testUpdateWithDictionary() async throws {
        let param = SPKHybridSchemeParam(withDictionary: ["initial": "value"])
        let updateDict: [String: Any] = ["url": "https://updated.com", "new_param": "new_value"]
        
        param.update(withDictionary: updateDict)
        
        #expect(param.url == "https://updated.com")
        #expect(param.extra["new_param"] as? String == "new_value")
        #expect(param.extra["url"] as? String == "https://updated.com")
    }
    
    @Test func testUpdateWithNilDictionary() async throws {
        let param = SPKHybridSchemeParam(withDictionary: ["url": "https://example.com"])
        let originalUrl = param.url
        
        param.update(withDictionary: nil)
        
        #expect(param.url == originalUrl) // Should remain unchanged
    }
    
    @Test func testUpdateWithParam() async throws {
        let original = SPKHybridSchemeParam(withDictionary: ["url": "https://example.com", "param1": "value1"])
        let newParam = SPKHybridSchemeParam(withDictionary: ["param2": "value2", "url": "https://updated.com"])
        newParam.engineType = .SPKHybridEngineTypeLynx
        newParam.originURL = URL(string: "https://origin.com")
        newParam.resolvedURL = URL(string: "https://resolved.com")
        
        original.update(withParam: newParam)
        
        #expect(original.extra["param2"] as? String == "value2")
        #expect(original.url == "https://updated.com")
        #expect(original.engineType == .SPKHybridEngineTypeLynx)
        #expect(original.originURL?.absoluteString == "https://origin.com")
        #expect(original.resolvedURL?.absoluteString == "https://resolved.com")
    }
    
    // MARK: - URL Resolution Tests
    
    @Test func testCanResolveUrlStyleTrue() async throws {
        let url = URL(string: "https://example.com?url=https://target.com")!
        #expect(SPKHybridSchemeParam.canResolve(url: url) == true)
    }
    
    @Test func testCanResolveBundleStyleTrue() async throws {
        let url = URL(string: "https://example.com?bundle=test.bundle")!
        #expect(SPKHybridSchemeParam.canResolve(url: url) == true)
    }
    
    @Test func testCanResolveFalse() async throws {
        let url = URL(string: "https://example.com")!
        #expect(SPKHybridSchemeParam.canResolve(url: url) == false)
    }
    
    @Test func testCanResolveWithNilUrl() async throws {
        #expect(SPKHybridSchemeParam.canResolve(url: nil) == false)
    }
    
    // MARK: - Engine Type Tests
    
    @Test func testEngineTypeForLynxUrl() async throws {
        let url = URL(string: "https://lynxview.com?url=https://target.com")!
        let engineType = SPKHybridSchemeParam.engineType(withURL: url)
        #expect(engineType == .SPKHybridEngineTypeLynx)
    }
    
    @Test func testEngineTypeForWebviewUrl() async throws {
        let url = URL(string: "https://webview.com?url=https://target.com")!
        let engineType = SPKHybridSchemeParam.engineType(withURL: url)
        #expect(engineType == .SPKHybridEngineTypeWeb)
    }
    
    @Test func testEngineTypeForUnknownUrl() async throws {
        let url = URL(string: "https://unknown.com")!
        let engineType = SPKHybridSchemeParam.engineType(withURL: url)
        #expect(engineType == .SPKHybridEngineTypeUnknown)
    }
    
    @Test func testEngineTypeForNilUrl() async throws {
        let engineType = SPKHybridSchemeParam.engineType(withURL: nil)
        #expect(engineType == .SPKHybridEngineTypeUnknown)
    }
    
    // MARK: - Resolver Tests
    
    @Test func testResolverWithLynxUrl() async throws {
        let url = URL(string: "https://lynx.com?url=https://target.com&param1=value1")!
        let result = SPKHybridSchemeParam.resolver(withScheme: url)
        
        #expect(result.originURL == url)
        #expect(result.resolvedURL != nil)
        #expect(result.engineType == .SPKHybridEngineTypeLynx)
        #expect(result.extra["url"] as? String == "https://target.com")
        #expect(result.extra["param1"] as? String == "value1")
    }
    
    @Test func testResolverWithWebviewUrl() async throws {
        let url = URL(string: "https://webview.com?url=https://target.com&param1=value1")!
        let result = SPKHybridSchemeParam.resolver(withScheme: url)
        
        #expect(result.originURL == url)
        #expect(result.resolvedURL != nil)
        #expect(result.engineType == .SPKHybridEngineTypeWeb)
        #expect(result.extra["url"] as? String == "https://target.com")
        #expect(result.extra["param1"] as? String == "value1")
    }
    
    @Test func testResolverWithBundleStyle() async throws {
        let url = URL(string: "https://lynx.com?bundle=test.bundle&param1=value1")!
        let result = SPKHybridSchemeParam.resolver(withScheme: url)
        
        #expect(result.originURL == url)
        #expect(result.resolvedURL != nil)
        #expect(result.engineType == .SPKHybridEngineTypeLynx)
        #expect(result.extra["bundle"] as? String == "test.bundle")
        #expect(result.extra["param1"] as? String == "value1")
    }
    
    @Test func testResolverWithNilUrl() async throws {
        let result = SPKHybridSchemeParam.resolver(withScheme: nil)
        
        #expect(result.originURL == nil)
        #expect(result.resolvedURL != nil) // Should still create a resolved URL
        #expect(result.engineType == .SPKHybridEngineTypeUnknown)
    }
    
    // MARK: - Dictionary Processing Tests
    
    @Test func testDictionaryWithInnerUrlQueryItems() async throws {
        let param = SPKHybridSchemeParam()
        let dict: [String: Any] = ["url": "https://example.com?inner1=value1&inner2=value2", "outer": "outerValue"]
        
        let result = param.dictionary(withInnerUrlQueryItems: dict)
        
        #expect(result?["inner1"] as? String == "value1")
        #expect(result?["inner2"] as? String == "value2")
        #expect(result?["outer"] as? String == "outerValue")
        #expect(result?["url"] as? String == "https://example.com?inner1=value1&inner2=value2")
    }
    
    @Test func testDictionaryWithNilInput() async throws {
        let param = SPKHybridSchemeParam()
        let result = param.dictionary(withInnerUrlQueryItems: nil)
        #expect(result == nil)
    }
    
    @Test func testDictionaryWithoutUrlKey() async throws {
        let param = SPKHybridSchemeParam()
        let dict: [String: Any] = ["param1": "value1", "param2": "value2"]
        
        let result = param.dictionary(withInnerUrlQueryItems: dict)
        
        #expect(result?["param1"] as? String == "value1")
        #expect(result?["param2"] as? String == "value2")
    }
    
    // MARK: - Style Check Tests
    
    @Test func testCheckUrlStyleTrue() async throws {
        let queries = ["url": "https://example.com"]
        #expect(SPKHybridSchemeParam.checkUrlStyle(inQueries: queries) == true)
    }
    
    @Test func testCheckUrlStyleFalse() async throws {
        let queries = ["other": "value"]
        #expect(SPKHybridSchemeParam.checkUrlStyle(inQueries: queries) == false)
    }
    
    @Test func testCheckBundleStyleTrue() async throws {
        let queries = ["bundle": "test.bundle"]
        #expect(SPKHybridSchemeParam.checkBundleStyle(inQueries: queries) == true)
    }
    
    @Test func testCheckBundleStyleFalse() async throws {
        let queries = ["other": "value"]
        #expect(SPKHybridSchemeParam.checkBundleStyle(inQueries: queries) == false)
    }
    
    // MARK: - Edge Cases and Error Handling
    
    @Test func testHandleMalformedUrls() async throws {
        let dict: [String: Any] = ["url": "not-a-valid-url"]
        let param = SPKHybridSchemeParam(withDictionary: dict)
        
        #expect(param.url == "not-a-valid-url")
        #expect(param.extra["url"] as? String == "not-a-valid-url")
    }
    
    @Test func testHandleSpecialCharacters() async throws {
        let dict: [String: Any] = [
            "url": "https://example.com?param=hello%20world&special=!@#$%^&*()",
            "unicode": "test unicode parameter"
        ]
        let param = SPKHybridSchemeParam(withDictionary: dict)
        
        #expect(param.url != nil)
        #expect(param.extra["unicode"] as? String == "test unicode parameter")
    }
    
    @Test func testPerformanceWithLargeParameterSets() async throws {
        var largeDict: [String: Any] = [:]
        for i in 0..<1000 {
            largeDict["param\(i)"] = "value\(i)"
        }
        largeDict["url"] = "https://example.com"
        
        let startTime = CFAbsoluteTimeGetCurrent()
        let param = SPKHybridSchemeParam(withDictionary: largeDict)
        let endTime = CFAbsoluteTimeGetCurrent()
        
        #expect(param.url == "https://example.com")
        #expect(param.extra.count >= 1000)
        #expect(endTime - startTime < 1.0) // Should complete within 1 second
    }
}

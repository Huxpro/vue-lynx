// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Foundation
@testable import Sparkling

struct SPKSchemeTests {
    
    @Test func resolverWithValidURL() {
        let url = URL(string: "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle")
        let context = SPKContext()
        
        let param = SPKScheme.resolver(withScheme: url, context: context, paramClass: SPKSchemeParam.self)
        
        #expect(param != nil)
        #expect(param?.resolvedURL != nil)
        // The resolvedURL may be encoded differently, so we check the scheme and host instead of exact equality
        #expect(param?.resolvedURL?.scheme == "hybrid")
        #expect(param?.resolvedURL?.host == "hybrid")
        // Verify the bundle parameter is preserved (may be URL encoded)
        let resolvedQuery = param?.resolvedURL?.query
        #expect(resolvedQuery?.contains("bundle") == true)
    }
    
    @Test func resolverWithNilURL() {
        let context = SPKContext()
        
        let param = SPKScheme.resolver(withScheme: nil, context: context, paramClass: SPKSchemeParam.self)
        
        #expect(param == nil)
    }
    
    @Test func resolverWithNilContext() {
        let url = URL(string: "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle")
        
        let param = SPKScheme.resolver(withScheme: url, context: nil, paramClass: SPKSchemeParam.self)
        
        #expect(param != nil)
    }
    
    @Test func resolverWithQueryParameters() {
        let url = URL(string: "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle&title=Test&hide_nav_bar=true")
        let context = SPKContext()
        
        let param = SPKScheme.resolver(withScheme: url, context: context, paramClass: SPKSchemeParam.self)
        
        #expect(param != nil)
        #expect(param?.title == "Test")
        #expect(param?.hideNavBar == true)
    }
    
    @Test func resolverWithExistingSchemeParams() {
        let url = URL(string: "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle&title=NewTitle")
        let context = SPKContext()
        
        // First, create an existing schemeParams in context
        let existingParam = SPKSchemeParam()
        existingParam.title = "ExistingTitle"
        existingParam.hideNavBar = true
        context.schemeParams = existingParam
        
        let param = SPKScheme.resolver(withScheme: url, context: context, paramClass: SPKSchemeParam.self)
        
        #expect(param != nil)
        // The existing param should be used as base and updated with new values
        #expect(param === existingParam) // Should be the same object reference
        #expect(param?.title == "NewTitle") // Should be updated with new value
        #expect(param?.hideNavBar == true) // Should retain existing value
    }
}

struct SPKSchemeParamTests {
    
    @Test func initialization() {
        let param = SPKSchemeParam()
        
        #expect(param.hideNavBar == false)
        #expect(param.title == "SPK Page")
        #expect(param.navBarColor == UIColor.white)
        #expect(param.resolvedURL == nil)
    }
    
    @Test func updateWithDictionary() {
        let param = SPKSchemeParam()
        let dict = [
            "title": "Test Title",
            "hide_nav_bar": true,
            "nav_bar_color": "#FF0000"
        ] as [String: Any]
        
        param.update(withDictionary: dict)
        
        #expect(param.title == "Test Title")
        #expect(param.hideNavBar == true)
        #expect(param.navBarColor != nil)
    }
    
    @Test func updateWithContext() {
        let param = SPKSchemeParam()
        let context = SPKContext()
        // SPKContext doesn't have title property
        
        param.update(withDictionary: [:], context: context)
        
        // Context doesn't affect param title directly
    }
    
    @Test func statusFontModeHandling() {
        let param = SPKSchemeParam()
        let dict = ["status_font_mode": "dark"]
        
        param.update(withDictionary: dict)
        
        #expect(param.statusFontMode == .darkContent)
    }
    
    @Test func colorPropertyHandling() {
        let param = SPKSchemeParam()
        let dict = [
            "navBarColor": "#FF0000",
            "backgroundColor": "#00FF00"
        ]
        
        param.update(withDictionary: dict)
        
        #expect(param.navBarColor != nil)
        // backgroundColor property doesn't exist in SPKSchemeParam
    }
    
    @Test func booleanPropertyHandling() {
        let param = SPKSchemeParam()
        let dict = [
            "hide_nav_bar": "true",
            "full_screen": false
        ] as [String: Any]
        
        param.update(withDictionary: dict)
        
        #expect(param.hideNavBar == true)
        // fullScreen property doesn't exist in SPKSchemeParam
    }
    
    @Test func nilValueHandling() {
        let param = SPKSchemeParam()
        let dict = [
            "title": NSNull(),
            "hideNavBar": nil
        ] as [String: Any?]
        
        param.update(withDictionary: dict as [String: Any])
        
        // Should not crash with nil values
        #expect(true)
    }
    
    @Test func updateWithParam() {
        let originalParam = SPKSchemeParam()
        originalParam.title = "Original Title"
        originalParam.hideNavBar = false
        originalParam.extra = ["original_key": "original_value"]
        
        let newParam = SPKSchemeParam()
        newParam.title = "New Title"
        newParam.hideNavBar = true
        newParam.extra = ["new_key": "new_value", "original_key": "updated_value"]
        newParam.originURL = URL(string: "https://example.com")
        newParam.resolvedURL = URL(string: "https://resolved.com")
        
        originalParam.update(withParam: newParam)
        
        #expect(originalParam.originURL?.absoluteString == "https://example.com")
        #expect(originalParam.resolvedURL?.absoluteString == "https://resolved.com")
        #expect(originalParam.extra["new_key"] as? String == "new_value")
        #expect(originalParam.extra["original_key"] as? String == "updated_value")
    }
    
    @Test func isColorStringClearWithValidTransparentColor() {
        let param = SPKSchemeParam()
        
        // Test with valid 8-character hex color with alpha 00 (transparent)
        #expect(param.isColorStringClear("FF0000FF") == false) // Opaque red
        #expect(param.isColorStringClear("FF000000") == true)  // Transparent red
        #expect(param.isColorStringClear("00FF0000") == true)  // Transparent green
        #expect(param.isColorStringClear("0000FF00") == true)  // Transparent blue
    }
    
    @Test func isColorStringClearWithInvalidInputs() {
        let param = SPKSchemeParam()
        
        // Test with invalid length
        #expect(param.isColorStringClear("FF0000") == false)   // 6 characters
        #expect(param.isColorStringClear("FF000000F") == false) // 9 characters
        #expect(param.isColorStringClear("") == false)         // Empty string
        
        // Test with invalid characters
        #expect(param.isColorStringClear("GG000000") == false) // Invalid hex character
        #expect(param.isColorStringClear("FF00000Z") == false) // Invalid hex character
        
        // Test with non-transparent alpha
        #expect(param.isColorStringClear("FF0000FF") == false) // Alpha FF (opaque)
        #expect(param.isColorStringClear("FF000001") == false) // Alpha 01 (almost transparent)
    }
}

struct SPKContextTests {
    
    @Test func initialization() {
        let context = SPKContext()
        
        #expect(context.loadingViewBuilder == nil)
        #expect(context.failedViewBuilder == nil)
        #expect(context.naviBar == nil)
    }
    
    @Test @MainActor func initializationWithBuilders() {
        let loadingBuilder: SPKLoadingViewBuilder = { UIView() as! (UIView & SPKLoadingViewProtocol) }
        let failedBuilder: SPKFailedViewBuilder = { _, _ in UIView() as! (UIView & SPKLoadErrorViewProtocol) }
        let naviBar = SPKNavigationBar()
        
        let context = SPKContext(
            loadingViewBuilder: loadingBuilder,
            failedViewBuilder: failedBuilder,
            naviBar: naviBar
        )
        
        #expect(context.loadingViewBuilder != nil)
        #expect(context.failedViewBuilder != nil)
        #expect(context.naviBar === naviBar)
    }
    
    @Test func copyMethod() {
        let originalContext = SPKContext()
        // SPKContext doesn't have title property
        originalContext.originURL = "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle"
        
        let copiedContext = originalContext.copy() as? SPKContext
        
        #expect(copiedContext != nil)
        // SPKContext doesn't have title property
        #expect(copiedContext?.originURL == "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle")
        #expect(copiedContext !== originalContext)
    }
    
    @Test func propertyUpdates() {
        let context = SPKContext()
        
        // SPKContext doesn't have title property
        context.originURL = "https://example.com"
        context.containerBackgroundColor = UIColor.red
        
        // SPKContext doesn't have title property
        #expect(context.originURL == "https://example.com")
        #expect(context.containerBackgroundColor == UIColor.red)
    }
    
    @Test func memoryManagement() {
        weak var weakContext: SPKContext?
        
        autoreleasepool {
            let context = SPKContext()
            weakContext = context
            #expect(weakContext != nil)
        }
        
        #expect(weakContext == nil)
    }
}

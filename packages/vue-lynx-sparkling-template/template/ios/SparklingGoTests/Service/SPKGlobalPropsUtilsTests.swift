// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
@testable import Sparkling

@MainActor
struct SPKGlobalPropsUtilsTests {
    
    // MARK: - Helper Methods
    
    private func createTestGlobalProps() -> [String: Any] {
        return SPKGlobalPropsUtils.defaultGlobalProps()
    }
    
    private func validateRequiredKeys(_ globalProps: [String: Any]) {
        let requiredKeys = [
            "screenWidth", "screenHeight", "statusBarHeight", "os", "osVersion",
            "language", "isIPhoneX", "isIPhoneXMax", "safeAreaHeight", "contentHeight",
            "isPad", "topHeight", "bottomHeight", "accessibleMode", "isLowPowerMode",
            "isAppBackground", "screenOrientation", "deviceModel"
        ]
        
        for key in requiredKeys {
            #expect(globalProps[key] != nil, "Missing key: \(key)")
        }
    }
    
    // MARK: - Basic Tests
    
    @Test func testDefaultGlobalPropsBasicStructure() {
        let globalProps = createTestGlobalProps()
        
        #expect(globalProps.count > 0)
        #expect(globalProps is [String: Any])
        validateRequiredKeys(globalProps)
    }
    
    @Test func testScreenDimensions() {
        let globalProps = createTestGlobalProps()
        
        let screenWidth = globalProps["screenWidth"] as? CGFloat
        let screenHeight = globalProps["screenHeight"] as? CGFloat
        
        #expect(screenWidth != nil && screenWidth! > 0)
        #expect(screenHeight != nil && screenHeight! > 0)
        #expect(screenWidth == UIScreen.main.bounds.size.width)
        #expect(screenHeight == UIScreen.main.bounds.size.height)
    }
    
    @Test func testSystemInfo() {
        let globalProps = createTestGlobalProps()
        
        #expect(globalProps["os"] as? String == "ios")
        #expect(globalProps["osVersion"] as? String == UIDevice.current.systemVersion)
        #expect(globalProps["language"] as? String == (NSLocale.preferredLanguages.first ?? ""))
    }
    
    @Test func testDeviceProperties() {
        let globalProps = createTestGlobalProps()
        
        let isPad = globalProps["isPad"] as? Int
        let expectedIsPad = UIDevice.current.userInterfaceIdiom == .pad ? 1 : 0
        #expect(isPad == expectedIsPad)
        
        let isIPhoneX = globalProps["isIPhoneX"] as? Int
        let isIPhoneXMax = globalProps["isIPhoneXMax"] as? Int
        #expect(isIPhoneX == 0 || isIPhoneX == 1)
        #expect(isIPhoneXMax == 0 || isIPhoneXMax == 1)
    }
    
    @Test func testLayoutProperties() {
        let globalProps = createTestGlobalProps()
        
        let topHeight = globalProps["topHeight"] as? CGFloat
        let bottomHeight = globalProps["bottomHeight"] as? CGFloat
        let contentHeight = globalProps["contentHeight"] as? CGFloat
        let safeAreaHeight = globalProps["safeAreaHeight"] as? Int
        
        #expect(topHeight != nil && topHeight! >= 0)
        #expect(bottomHeight != nil && bottomHeight! >= 0)
        #expect(contentHeight != nil && contentHeight! > 0)
        #expect(safeAreaHeight != nil && safeAreaHeight! >= 0)
    }
    
    @Test func testAccessibilityAndPowerMode() {
        let globalProps = createTestGlobalProps()
        
        let accessibleMode = globalProps["accessibleMode"] as? Int
        let isLowPowerMode = globalProps["isLowPowerMode"] as? Int
        let isAppBackground = globalProps["isAppBackground"] as? Bool
        
        #expect(accessibleMode != nil && accessibleMode! >= 0)
        #expect(isLowPowerMode == 0 || isLowPowerMode == 1)
        #expect(isAppBackground != nil)
        
        let expectedIsLowPowerMode = ProcessInfo.processInfo.isLowPowerModeEnabled ? 1 : 0
        #expect(isLowPowerMode == expectedIsLowPowerMode)
    }
    
    // MARK: - Utility Methods Tests
    
    @Test func testScreenOrientationString() {
        let orientation = SPKGlobalPropsUtils.screenOrientationString()
        let validOrientations = ["Unknown", "Portrait", "PortraitUpsideDown", "LandscapeLeft", "LandscapeRight", "Unknwon"]
        #expect(validOrientations.contains(orientation))
    }
    
    @Test func testAccessModeNumber() {
        let accessMode = SPKGlobalPropsUtils.accessModeNumber()
        #expect(accessMode >= 0)
        
        if UIAccessibility.isVoiceOverRunning {
            #expect((accessMode & (1 << 0)) != 0)
        } else {
            #expect((accessMode & (1 << 0)) == 0)
        }
    }
    
    // MARK: - Integration Tests
    
    @Test func testConsistencyAndIntegration() {
        let globalProps1 = createTestGlobalProps()
        let globalProps2 = createTestGlobalProps()
        
        // Static values should be consistent
        #expect(globalProps1["screenWidth"] as? CGFloat == globalProps2["screenWidth"] as? CGFloat)
        #expect(globalProps1["os"] as? String == globalProps2["os"] as? String)
        #expect(globalProps1["isPad"] as? Int == globalProps2["isPad"] as? Int)
        
        // iPhone X series consistency
        let isIPhoneX = globalProps1["isIPhoneX"] as? Int ?? 0
        let safeAreaHeight = globalProps1["safeAreaHeight"] as? Int ?? 0
        if isIPhoneX == 1 {
            #expect(safeAreaHeight == 34)
        } else {
            #expect(safeAreaHeight == 0)
        }
    }
    
    @Test func testPerformanceAndEdgeCases() {
        // Performance test
        let startTime = CFAbsoluteTimeGetCurrent()
        for _ in 0..<50 {
            let _ = createTestGlobalProps()
        }
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        #expect(timeElapsed < 1.0)
        
        // Edge cases - ensure no crashes
        let globalProps = createTestGlobalProps()
        #expect(globalProps["topHeight"] != nil)
        #expect(globalProps["bottomHeight"] != nil)
        #expect(globalProps["statusBarHeight"] != nil)
    }
}

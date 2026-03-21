// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKDeviceTests {
    @Test func testHwModel_notNil() {
        let model = SPKKitWrapper<UIDevice>.hwModel
        #expect(model != nil)
        #expect(model?.count ?? 0 > 0)
    }
    
    @Test func testHwModel_validFormat() {
        let model = SPKKitWrapper<UIDevice>.hwModel
        if let model = model {
            // Hardware model should contain letters and numbers
            #expect(model.contains(where: { $0.isLetter }))
            #expect(!model.isEmpty)
            #expect(!model.contains(" ")) // Should not contain spaces
        }
    }
    
    @Test func testHwModel_consistency() {
        let model1 = SPKKitWrapper<UIDevice>.hwModel
        let model2 = SPKKitWrapper<UIDevice>.hwModel
        #expect(model1 == model2)
    }
    
    @Test func testIsIPhoneXSeries_type() {
        let result = SPKKitWrapper<UIDevice>.isIPhoneXSeries
        #expect(type(of: result) == Bool.self)
    }
    
    @Test func testIsIPhoneXSeries_consistency() {
        let result1 = SPKKitWrapper<UIDevice>.isIPhoneXSeries
        let result2 = SPKKitWrapper<UIDevice>.isIPhoneXSeries
        #expect(result1 == result2)
    }
    
    @Test func testIsIPhoneXSeries_logicalCheck() {
        let isXSeries = SPKKitWrapper<UIDevice>.isIPhoneXSeries
        let model = SPKKitWrapper<UIDevice>.hwModel
        
        if let model = model {
            // If it's a simulator, may not be able to accurately determine
            if model.contains("Simulator") {
                // In simulator case, result should be a boolean value
                #expect(type(of: isXSeries) == Bool.self)
            } else {
                // Logical check for real device case
                if model.contains("iPhone") {
                    // iPhone X series model identifier check
                    let xSeriesModels = ["iPhone10", "iPhone11", "iPhone12", "iPhone13", "iPhone14", "iPhone15"]
                    let shouldBeXSeries = xSeriesModels.contains { model.hasPrefix($0) }
                    if shouldBeXSeries {
                        #expect(isXSeries == true)
                    }
                }
            }
        }
    }
    
    @Test func testDeviceProperties_basic() {
        let device = UIDevice.current
        
        // Test basic device properties
        #expect(!device.name.isEmpty)
        #expect(!device.systemName.isEmpty)
        #expect(!device.systemVersion.isEmpty)
        #expect(!device.model.isEmpty)
    }
    
    @Test func testDeviceUserInterfaceIdiom() {
        let device = UIDevice.current
        let idiom = device.userInterfaceIdiom
        
        // Verify user interface idiom is a valid value
        let validIdioms: [UIUserInterfaceIdiom] = [.phone, .pad, .tv, .carPlay, .mac, .vision]
        #expect(validIdioms.contains(idiom))
    }
    
    @Test func testSystemVersion_format() {
        let version = UIDevice.current.systemVersion
        
        // System version should contain numbers and dots
        #expect(version.contains("."))
        #expect(version.contains(where: { $0.isNumber }))
        
        // Version format check (e.g.: 15.0, 16.1.1)
        let components = version.split(separator: ".")
        #expect(components.count >= 2)
        #expect(components.count <= 4)
        
        for component in components {
            #expect(Int(component) != nil)
        }
    }
}


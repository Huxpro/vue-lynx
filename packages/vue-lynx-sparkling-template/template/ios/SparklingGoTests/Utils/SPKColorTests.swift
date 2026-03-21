// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

struct SPKColorTests {
    @Test func testColorFromHexString_shortHex() {
        let color = SPKKitWrapper<UIColor>.color(hexString: "#0f8")
        #expect(color != nil)
        #expect(color.spk.hexString == "00ff88")
    }
    
    @Test func testColorFromHexString_6DigitHex() {
        let color = SPKKitWrapper<UIColor>.color(hexString: "123456")
        #expect(color != nil)
        #expect(color.spk.hexString == "123456")
    }
    
    @Test func testColorFromHexString_8DigitHex() {
        let color = SPKKitWrapper<UIColor>.color(hexString: "12345678")
        #expect(color != nil)
        #expect(color.spk.hexString == "123456")
    }
    
    @Test func testColorFromHexString_withPrefix() {
        let color1 = SPKKitWrapper<UIColor>.color(hexString: "0xabcdef")
        #expect(color1.spk.hexString == "abcdef")
        let color2 = SPKKitWrapper<UIColor>.color(hexString: "0Xabcdef")
        #expect(color2.spk.hexString == "abcdef")
        let color3 = SPKKitWrapper<UIColor>.color(hexString: "#abcdef")
        #expect(color3.spk.hexString == "abcdef")
    }
    
    @Test func testColorRGBInitializer() {
        let rgbValue: UInt32 = 0x336699
        let alpha: CGFloat = 0.5
        let color = SPKKitWrapper<UIColor>.color(rgb: rgbValue, alpha: alpha)
        #expect(color.spk.hexString == "336699")
        #expect(color.cgColor.alpha == alpha)
    }
    
    @Test func testColorRGBAInitializer() {
        let rgbaValue: UInt32 = 0x33669980
        let color = SPKKitWrapper<UIColor>.color(rgba: rgbaValue)
        #expect(color.spk.hexString == "336699")
        #expect(round(color.cgColor.alpha * 255) == 128)
    }
    
    @Test func testHexStringWithoutAlpha() {
        let color = UIColor(red: 0.2, green: 0.4, blue: 0.6, alpha: 1)
        #expect(color.spk.hexString == "336699")
    }
    
    @Test func testHexStringWithAlpha() {
        let color = UIColor(red: 0.2, green: 0.4, blue: 0.6, alpha: 0.5)
        #expect(color.spk.hexStringWithAlpha == "33669980")
    }
    
    @Test func testHexString_invalidColorSpace() {
        let patternColor = UIColor(patternImage: UIImage())
        #expect(patternColor.spk.hexString == nil)
        #expect(patternColor.spk.hexStringWithAlpha == nil)
    }
    
    @Test func testColorFromHexString_caseInsensitive() {
        let lowerColor = SPKKitWrapper<UIColor>.color(hexString: "abcdef")
        let upperColor = SPKKitWrapper<UIColor>.color(hexString: "ABCDEF")
        let mixedColor = SPKKitWrapper<UIColor>.color(hexString: "AbCdEf")
        
        #expect(lowerColor.spk.hexString == "abcdef")
        #expect(upperColor.spk.hexString == "abcdef")
        #expect(mixedColor.spk.hexString == "abcdef")
    }
    
    @Test func testColorRGB_boundaryValues() {
        // Test minimum values
        let minColor = SPKKitWrapper<UIColor>.color(rgb: 0x000000, alpha: 0.0)
        #expect(minColor.spk.hexString == "000000")
        #expect(minColor.cgColor.alpha == 0.0)
        
        // Test maximum values
        let maxColor = SPKKitWrapper<UIColor>.color(rgb: 0xFFFFFF, alpha: 1.0)
        #expect(maxColor.spk.hexString == "ffffff")
        #expect(maxColor.cgColor.alpha == 1.0)
    }
    
    @Test func testColorRGBA_alphaExtraction() {
        // Test different alpha values
        let transparentColor = SPKKitWrapper<UIColor>.color(rgba: 0xFF000000)
        #expect(round(transparentColor.cgColor.alpha * 255) == 0)
        
        let opaqueColor = SPKKitWrapper<UIColor>.color(rgba: 0xFF0000FF)
        #expect(round(opaqueColor.cgColor.alpha * 255) == 255)
        
        let halfAlphaColor = SPKKitWrapper<UIColor>.color(rgba: 0xFF000080)
        #expect(round(halfAlphaColor.cgColor.alpha * 255) == 128)
    }
    
    @Test func testHexString_extremeValues() {
        // Test pure colors
        let redColor = UIColor.red
        #expect(redColor.spk.hexString == "ff0000")
        
        let greenColor = UIColor.green
        #expect(greenColor.spk.hexString == "00ff00")
        
        let blueColor = UIColor.blue
        #expect(blueColor.spk.hexString == "0000ff")
        
        let blackColor = UIColor.black
        #expect(blackColor.spk.hexString == "000000")
        
        let whiteColor = UIColor.white
        #expect(whiteColor.spk.hexString == "ffffff")
    }
    
    @Test func testHexStringWithAlpha_precision() {
        // Test alpha precision
        let color1 = UIColor(red: 1.0, green: 0.0, blue: 0.0, alpha: 0.25)
        #expect(color1.spk.hexStringWithAlpha == "ff000040")
        
        let color2 = UIColor(red: 0.0, green: 1.0, blue: 0.0, alpha: 0.75)
        #expect(color2.spk.hexStringWithAlpha == "00ff00bf")
    }
}

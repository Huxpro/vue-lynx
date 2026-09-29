// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import UIKit
@testable import Sparkling

@MainActor
struct SPKNavigationBarTests {
    
    @Test func initialization() {
        let navBar = SPKNavigationBar()
        
        #expect(navBar.bottomLineHeight == 0.5)
        #expect(navBar.bottomLineColor != nil)
        #expect(navBar.titleFont != nil)
        #expect(navBar.titleColor != nil)
    }
    
    @Test func titleSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.title = "Test Title"
        
        #expect(navBar.title == "Test Title")
        #expect(navBar.titleLabel.text == "Test Title")
    }
    
    @Test func titleColorSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.titleColor = UIColor.red
        
        #expect(navBar.titleColor == UIColor.red)
        #expect(navBar.titleLabel.textColor == UIColor.red)
    }
    
    @Test func titleFontSetting() {
        let navBar = SPKNavigationBar()
        let customFont = UIFont.systemFont(ofSize: 20)
        
        navBar.titleFont = customFont
        
        #expect(navBar.titleFont == customFont)
        #expect(navBar.titleLabel.font == customFont)
    }
    
    @Test func bottomLineProperties() {
        let navBar = SPKNavigationBar()
        
        navBar.bottomLineHeight = 2.0
        navBar.bottomLineColor = UIColor.blue
        
        #expect(navBar.bottomLineHeight == 2.0)
        #expect(navBar.bottomLineColor == UIColor.blue)
    }
    
    @Test func leftButtonImageSetting() {
        let navBar = SPKNavigationBar()
        let testImage = UIImage()
        
        navBar.leftButtonImage = testImage
        
        #expect(navBar.leftButtonImage == testImage)
    }
    
    @Test func leftButtonTitleSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.leftButtonTitle = "Back"
        
        #expect(navBar.leftButtonTitle == "Back")
    }
    
    @Test func leftButtonFontSetting() {
        let navBar = SPKNavigationBar()
        let customFont = UIFont.boldSystemFont(ofSize: 16)
        
        navBar.leftButtonFont = customFont
        
        #expect(navBar.leftButtonFont == customFont)
    }
    
    @Test func leftButtonColorSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.leftButtonTitleColor = UIColor.green
        
        #expect(navBar.leftButtonTitleColor == UIColor.green)
    }
    
    @Test func rightButtonImageSetting() {
        let navBar = SPKNavigationBar()
        let testImage = UIImage()
        
        navBar.rightButtonImage = testImage
        
        #expect(navBar.rightButtonImage == testImage)
    }
    
    @Test func rightButtonTitleSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.rightButtonTitle = "Done"
        
        #expect(navBar.rightButtonTitle == "Done")
    }
    
    @Test func rightButtonFontSetting() {
        let navBar = SPKNavigationBar()
        let customFont = UIFont.boldSystemFont(ofSize: 16)
        
        navBar.rightButtonFont = customFont
        
        #expect(navBar.rightButtonFont == customFont)
    }
    
    @Test func rightButtonColorSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.rightButtonTitleColor = UIColor.purple
        
        #expect(navBar.rightButtonTitleColor == UIColor.purple)
    }
    
    @Test func closeButtonImageSetting() {
        let navBar = SPKNavigationBar()
        let testImage = UIImage()
        
        navBar.closeButtonImage = testImage
        
        #expect(navBar.closeButtonImage == testImage)
    }
    
    @Test func closeButtonTitleSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.closeButtonTitle = "Close"
        
        #expect(navBar.closeButtonTitle == "Close")
    }
    
    @Test func closeButtonFontSetting() {
        let navBar = SPKNavigationBar()
        let customFont = UIFont.boldSystemFont(ofSize: 16)
        
        navBar.closeButtonFont = customFont
        
        #expect(navBar.closeButtonFont == customFont)
    }
    
    @Test func closeButtonColorSetting() {
        let navBar = SPKNavigationBar()
        
        navBar.closeButtonTitleColor = UIColor.orange
        
        #expect(navBar.closeButtonTitleColor == UIColor.orange)
    }
    
    @Test func buttonActions() {
        let navBar = SPKNavigationBar()
        var leftActionCalled = false
        var rightActionCalled = false
        var closeActionCalled = false
        
        navBar.leftButtonAction = { _ in leftActionCalled = true }
        navBar.rightButtonAction = { _ in rightActionCalled = true }
        navBar.closeButtonAction = { _ in closeActionCalled = true }
        
        navBar.leftButtonAction?(navBar)
        navBar.rightButtonAction?(navBar)
        navBar.closeButtonAction?(navBar)
        
        #expect(leftActionCalled == true)
        #expect(rightActionCalled == true)
        #expect(closeActionCalled == true)
    }
    
    @Test func memoryManagement() {
        weak var weakNavBar: SPKNavigationBar?
        
        autoreleasepool {
            let navBar = SPKNavigationBar()
            weakNavBar = navBar
            #expect(weakNavBar != nil)
        }
        
        #expect(weakNavBar == nil)
    }
    
    @Test func multiplePropertyUpdates() {
        let navBar = SPKNavigationBar()
        
        navBar.title = "Multi Test"
        navBar.titleColor = UIColor.red
        navBar.bottomLineHeight = 3.0
        navBar.leftButtonTitle = "Left"
        navBar.rightButtonTitle = "Right"
        
        #expect(navBar.title == "Multi Test")
        #expect(navBar.titleColor == UIColor.red)
        #expect(navBar.bottomLineHeight == 3.0)
        #expect(navBar.leftNaviButton.currentTitle == "Left")
        #expect(navBar.rightNaviButton.currentTitle == "Right")
    }
    
    @Test func showCloseButton() {
        let navBar = SPKNavigationBar()
        
        // Test showing close button
        navBar.show(closeButton: true)
        #expect(navBar.closeNaviButton.isHidden == false)
        
        // Test hiding close button
        navBar.show(closeButton: false)
        #expect(navBar.closeNaviButton.isHidden == true)
    }
    
    @Test func updateCenterTitle() {
        let navBar = SPKNavigationBar()
        
        navBar.update(centerTitle: "Test Title")
        #expect(navBar.title == "Test Title")
        
        navBar.update(centerTitle: "")
        #expect(navBar.title == "")
        
        navBar.update(centerTitle: "Another Title")
        #expect(navBar.title == "Another Title")
    }
    
    @Test func updateTitleColor() {
        let navBar = SPKNavigationBar()
        
        navBar.update(titleColor: UIColor.red)
        #expect(navBar.titleColor == UIColor.red)
        
        navBar.update(titleColor: UIColor.blue)
        #expect(navBar.titleColor == UIColor.blue)
        
        navBar.update(titleColor: UIColor.clear)
        #expect(navBar.titleColor == UIColor.clear)
    }
    
    @Test func setNavigationBarBackButtonEnable() {
        let navBar = SPKNavigationBar()
        
        // Test enabling buttons
        navBar.set(navigationBarBackButtonEnable: true)
        #expect(navBar.leftNaviButton.isEnabled == true)
        #expect(navBar.closeNaviButton.isEnabled == true)
        
        // Test disabling buttons
        navBar.set(navigationBarBackButtonEnable: false)
        #expect(navBar.leftNaviButton.isEnabled == false)
        #expect(navBar.closeNaviButton.isEnabled == false)
    }
    
    @Test func setBottomLineHidden() {
        let navBar = SPKNavigationBar()
        
        // Test hiding bottom line
        navBar.set(bottomLine: true)
        #expect(navBar.bottomLineColor == UIColor.clear)
        
        // Test showing bottom line
        navBar.set(bottomLine: false)
        #expect(navBar.bottomLineColor == UIColor(red: 0.91, green: 0.91, blue: 0.91, alpha: 1))
    }
    
    @Test func setupLeftButton() {
        let navBar = SPKNavigationBar()
        let mockButton = MockNavigationBarButton()
        
        navBar.setup(leftButton: mockButton)
        
        #expect(navBar.leftButtonImage == mockButton.icon)
        
        // Test button action
        var actionCalled = false
        mockButton.navBarHandler = { _ in
            actionCalled = true
        }
        
        navBar.setup(leftButton: mockButton)
        navBar.didTapLeftButtonActionBlock?()
        #expect(actionCalled == true)
    }
    
    @Test func setupRightButton() {
        let navBar = SPKNavigationBar()
        let mockButton = MockNavigationBarButton()
        
        navBar.setup(rightButton: mockButton)
        
        #expect(navBar.rightButtonImage == mockButton.icon)
        
        // Test button action
        var actionCalled = false
        mockButton.navBarHandler = { _ in
            actionCalled = true
        }
        
        navBar.setup(rightButton: mockButton)
        navBar.didTapRightButtonActionBlock?()
        #expect(actionCalled == true)
    }
    
    @Test func setupButtonsWithNilHandler() {
        let navBar = SPKNavigationBar()
        let mockButton = MockNavigationBarButtonWithoutHandler()
        
        // Test left button without handler
        navBar.setup(leftButton: mockButton)
        #expect(navBar.leftButtonImage == mockButton.icon)
        
        // Test right button without handler
        navBar.setup(rightButton: mockButton)
        #expect(navBar.rightButtonImage == mockButton.icon)
    }
    
    @Test func handleLeftButtonAction() {
        let navBar = SPKNavigationBar()
        var actionCalled = false
        
        navBar.setLeftButtonActionBlock { _ in
            actionCalled = true
        }
        
        // Simulate button tap by calling the handler directly
        navBar.perform(#selector(SPKNavigationBar.handleLeftButton(_:)), with: navBar.leftNaviButton)
        
        #expect(actionCalled == true)
    }
    
    @Test func handleCloseButtonAction() {
        let navBar = SPKNavigationBar()
        var actionCalled = false
        
        navBar.setCloseButtonActionBlock { _ in
            actionCalled = true
        }
        
        // Simulate button tap by calling the handler directly
        navBar.perform(#selector(SPKNavigationBar.handleCloseButton(_:)), with: navBar.closeNaviButton)
        
        #expect(actionCalled == true)
    }
    
    @Test func handleRightButtonAction() {
        let navBar = SPKNavigationBar()
        var actionCalled = false
        
        navBar.setRightButtonActionBlock { _ in
            actionCalled = true
        }
        
        // Simulate button tap by calling the handler directly
        navBar.perform(#selector(SPKNavigationBar.handleRightButton(_:)), with: navBar.rightNaviButton)
        
        #expect(actionCalled == true)
    }
    
    @Test func buttonActionBlocksIntegration() {
        let navBar = SPKNavigationBar()
        var leftActionCalled = false
        var closeActionCalled = false
        var rightActionCalled = false
        
        // Set up action blocks
        navBar.setLeftButtonActionBlock { _ in
            leftActionCalled = true
        }
        
        navBar.setCloseButtonActionBlock { _ in
            closeActionCalled = true
        }
        
        navBar.setRightButtonActionBlock { _ in
            rightActionCalled = true
        }
        
        // Test all button actions
        navBar.perform(#selector(SPKNavigationBar.handleLeftButton(_:)), with: navBar.leftNaviButton)
        navBar.perform(#selector(SPKNavigationBar.handleCloseButton(_:)), with: navBar.closeNaviButton)
        navBar.perform(#selector(SPKNavigationBar.handleRightButton(_:)), with: navBar.rightNaviButton)
        
        #expect(leftActionCalled == true)
        #expect(closeActionCalled == true)
        #expect(rightActionCalled == true)
    }
}

// MARK: - Mock Classes for Testing

class MockNavigationBarButton: SPKNavigationBarButtonProtocol {
    var icon: UIImage = UIImage(systemName: "star") ?? UIImage()
    var navBarHandler: SPKNavBarHandler?
}

class MockNavigationBarButtonWithoutHandler: SPKNavigationBarButtonProtocol {
    var icon: UIImage = UIImage(systemName: "heart") ?? UIImage()
    var navBarHandler: SPKNavBarHandler? = nil
}

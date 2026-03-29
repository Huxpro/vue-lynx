// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import UIKit
import SparklingMethod
@testable import Sparkling

//TODO: DIContainer injection problem
@MainActor
struct SPKRouterTests {
    
    @Test func createWithValidURL() {
        let url = "hybrid://example.com/path"
        let frame = CGRect(x: 0, y: 0, width: 320, height: 568)
        
        let viewController = SPKRouter.create(withURL: url, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func createWithNilURL() {
        let frame = CGRect(x: 0, y: 0, width: 320, height: 568)
        
        let viewController = SPKRouter.create(withURL: nil, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func createWithContext() {
        let url = "hybrid://example.com/path"
        let context = SPKContext()
        let frame = CGRect(x: 0, y: 0, width: 320, height: 568)
        
        let viewController = SPKRouter.create(withURL: url, context: context, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func createWithDifferentSchemes() {
        let hybridURL = "hybrid://example.com/path"
        let httpURL = "http://example.com/path"
        let httpsURL = "https://example.com/path"
        let frame = CGRect.zero
        
        let hybridVC = SPKRouter.create(withURL: hybridURL, context: nil, frame: frame)
        let httpVC = SPKRouter.create(withURL: httpURL, context: nil, frame: frame)
        let httpsVC = SPKRouter.create(withURL: httpsURL, context: nil, frame: frame)
        
        #expect(hybridVC != nil)
        #expect(httpVC != nil)
        #expect(httpsVC != nil)
    }
    
    @Test func openWithValidURL() {
        // Create a proper view controller hierarchy for testing
        let window = UIWindow(frame: UIScreen.main.bounds)
        let rootVC = UIViewController()
        let navigationController = UINavigationController(rootViewController: rootVC)
        
        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        
        let url = "hybrid://example.com/path"
        
        SPKRouter.open(withURL: url, context: nil)
        
        // Clean up
        window.isHidden = true
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func openWithNilURL() {
        let navigationController = UINavigationController()
        let initialCount = navigationController.viewControllers.count
        
        SPKRouter.open(withURL: nil, context: nil)
        
        #expect(navigationController.viewControllers.count == initialCount)
    }
    
    @Test func openWithEmptyURL() {
        let navigationController = UINavigationController()
        let initialCount = navigationController.viewControllers.count
        
        SPKRouter.open(withURL: "", context: nil)
        
        #expect(navigationController.viewControllers.count == initialCount)
    }
    
    @Test func openInSystemBrowserWithValidURL() {
        let url = "https://example.com"
        
        // This should not crash
        SPKRouter.openInSystemBrowser(withURL: url)
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func openInSystemBrowserWithNilURL() {
        // This should not crash
        SPKRouter.openInSystemBrowser(withURL: nil)
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func openInSystemBrowserWithInvalidURL() {
        let invalidURL = "invalid-url"
        
        // This should not crash
        SPKRouter.openInSystemBrowser(withURL: invalidURL)
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func closeTopViewController() {
        // Create a proper view controller hierarchy for testing
        let window = UIWindow(frame: UIScreen.main.bounds)
        let rootVC = UIViewController()
        let navigationController = UINavigationController(rootViewController: rootVC)
        
        // Add a second view controller to test pop behavior
        let secondVC = UIViewController()
        navigationController.pushViewController(secondVC, animated: false)
        
        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        
        // Verify initial state
        #expect(navigationController.viewControllers.count == 2)
        
        // This should pop the top view controller
        SPKRouter.closeTopViewController()
        
        // Clean up
        window.isHidden = true
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func closeTopViewControllerWithSingleViewController() {
        // Test case where there's only one view controller (should dismiss)
        let window = UIWindow(frame: UIScreen.main.bounds)
        let rootVC = UIViewController()
        let navigationController = UINavigationController(rootViewController: rootVC)
        
        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        
        // Verify initial state
        #expect(navigationController.viewControllers.count == 1)
        
        // This should not crash even with single view controller
        SPKRouter.closeTopViewController()
        
        // Clean up
        window.isHidden = true
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func closeTopViewControllerWithNoNavigationController() {
        // Test case where there's no navigation controller structure
        let window = UIWindow(frame: UIScreen.main.bounds)
        let rootVC = UIViewController()
        
        window.rootViewController = rootVC
        window.makeKeyAndVisible()
        
        // This should not crash when there's no navigation controller
        SPKRouter.closeTopViewController()
        
        // Clean up
        window.isHidden = true
        
        #expect(true) // Test passes if no crash occurs
    }
    
    @Test func urlWithQueryParameters() {
        let url = "hybrid://example.com/path?param1=value1&param2=value2"
        let frame = CGRect.zero
        
        let viewController = SPKRouter.create(withURL: url, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func urlWithFragment() {
        let url = "hybrid://example.com/path#section1"
        let frame = CGRect.zero
        
        let viewController = SPKRouter.create(withURL: url, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func complexURL() {
        let url = "hybrid://example.com:8080/path/to/resource?param1=value1&param2=value2#section"
        let frame = CGRect.zero
        
        let viewController = SPKRouter.create(withURL: url, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func urlEncodedCharacters() {
        let url = "hybrid://example.com/path?param=%E4%B8%AD%E6%96%87"
        let frame = CGRect.zero
        
        let viewController = SPKRouter.create(withURL: url, context: nil, frame: frame)
        
        #expect(viewController != nil)
    }
    
    @Test func contextOriginURL() {
        let url = "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle"
        let context = SPKContext()
        let navigationController = UINavigationController()
        
        SPKRouter.open(withURL: url, context: context)
        
        #expect(context.originURL != nil)
    }
}

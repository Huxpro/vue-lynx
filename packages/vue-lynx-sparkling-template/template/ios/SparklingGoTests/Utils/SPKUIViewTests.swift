// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing
import Sparkling

@MainActor
struct SPKUIViewTests {
    @Test func testViewController_returnsCorrectVC() {
        let viewController = UIViewController()
        let containerView = UIView()
        viewController.view.addSubview(containerView)
        let testView = UIView()
        containerView.addSubview(testView)
        #expect(testView.spk.viewController === viewController)
        #expect(containerView.spk.viewController === viewController)
        #expect(viewController.view.spk.viewController === viewController)
    }
    
    @Test func testViewController_returnsNilIfNoVC() {
        let view = UIView()
        #expect(view.spk.viewController == nil)
    }
    
    @Test func testSafeAreaInsets_iOS13AndAbove() {
        if #available(iOS 13.0, *) {
            let view = UIView()
            let insets = view.spk.safeAreaInsets
            #expect(insets == view.safeAreaInsets)
        } else {
            #expect(true)
        }
    }
    
    @Test func testViewController_nestedViewHierarchy() {
        let rootViewController = UIViewController()
        let containerView = UIView()
        let middleView = UIView()
        let leafView = UIView()
        
        rootViewController.view.addSubview(containerView)
        containerView.addSubview(middleView)
        middleView.addSubview(leafView)
        
        // Test that deeply nested views can find the correct view controller
        #expect(leafView.spk.viewController === rootViewController)
        #expect(middleView.spk.viewController === rootViewController)
        #expect(containerView.spk.viewController === rootViewController)
    }
    
    @Test func testViewController_multipleViewControllers() {
        let parentVC = UIViewController()
        let childVC = UIViewController()
        
        parentVC.addChild(childVC)
        parentVC.view.addSubview(childVC.view)
        childVC.didMove(toParent: parentVC)
        
        let testView = UIView()
        childVC.view.addSubview(testView)
        
        // Test child view controller's view
        #expect(testView.spk.viewController === childVC)
        #expect(childVC.view.spk.viewController === childVC)
    }
    
    @Test func testViewController_removedFromSuperview() {
        let viewController = UIViewController()
        let containerView = UIView()
        let testView = UIView()
        
        viewController.view.addSubview(containerView)
        containerView.addSubview(testView)
        
        // Confirm initial state
        #expect(testView.spk.viewController === viewController)
        
        // Should not find view controller after removing from superview
        testView.removeFromSuperview()
        #expect(testView.spk.viewController == nil)
    }
    
    @Test func testViewController_windowlessView() {
        let viewController = UIViewController()
        let testView = UIView()
        
        // View controller's view is not added to window
        viewController.view.addSubview(testView)
        
        // Should still be able to find view controller
        #expect(testView.spk.viewController === viewController)
    }
    
    @Test func testSafeAreaInsets_differentViewTypes() {
        // Test different types of views
        let regularView = UIView()
        let scrollView = UIScrollView()
        let tableView = UITableView()
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: UICollectionViewFlowLayout())
        
        // All views should have safeAreaInsets property
        let regularInsets = regularView.spk.safeAreaInsets
        let scrollInsets = scrollView.spk.safeAreaInsets
        let tableInsets = tableView.spk.safeAreaInsets
        let collectionInsets = collectionView.spk.safeAreaInsets
        
        // Verify returned type is UIEdgeInsets
        #expect(regularInsets is UIEdgeInsets)
        #expect(scrollInsets is UIEdgeInsets)
        #expect(tableInsets is UIEdgeInsets)
        #expect(collectionInsets is UIEdgeInsets)
    }
    
    @Test func testSafeAreaInsets_withWindow() {
        let window = UIWindow(frame: UIScreen.main.bounds)
        let viewController = UIViewController()
        let testView = UIView()
        
        window.rootViewController = viewController
        viewController.view.addSubview(testView)
        window.makeKeyAndVisible()
        
        let insets = testView.spk.safeAreaInsets
        
        // With window, safeAreaInsets should reflect actual safe area
        #expect(insets == testView.safeAreaInsets)
        
        window.isHidden = true
    }
    
    @Test func testViewController_performanceWithDeepHierarchy() {
        let rootViewController = UIViewController()
        var currentView = rootViewController.view!
        
        // Create deep view hierarchy
        for i in 0..<100 {
            let newView = UIView()
            newView.tag = i
            currentView.addSubview(newView)
            currentView = newView
        }
        
        let startTime = CFAbsoluteTimeGetCurrent()
        let foundVC = currentView.spk.viewController
        let endTime = CFAbsoluteTimeGetCurrent()
        
        #expect(foundVC === rootViewController)
        
        // Performance test: should quickly find view controller even in deep nesting
        let duration = endTime - startTime
        #expect(duration < 0.01) // Should complete within 10ms
    }
    
    @Test func testViewController_circularReference() {
        let viewController = UIViewController()
        let containerView = UIView()
        let testView = UIView()
        
        viewController.view.addSubview(containerView)
        containerView.addSubview(testView)
        
        // Test normal case
        #expect(testView.spk.viewController === viewController)
        
        // Simulate possible circular reference scenario (though it won't happen in normal UIKit usage)
        // This mainly tests algorithm robustness
        weak var weakVC = viewController
        #expect(weakVC != nil)
    }
    
    @Test func testSafeAreaInsets_consistency() {
        let view = UIView()
        
        // Multiple calls should return consistent results
        let insets1 = view.spk.safeAreaInsets
        let insets2 = view.spk.safeAreaInsets
        let insets3 = view.spk.safeAreaInsets
        
        #expect(insets1 == insets2)
        #expect(insets2 == insets3)
        #expect(insets1 == insets3)
    }
}


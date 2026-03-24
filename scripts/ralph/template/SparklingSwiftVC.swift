// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Foundation
import SwiftUI
import Sparkling
import UIKit

class SparklingLynxElement: SPKLynxElement {
    var lynxElementName: String

    var lynxElementClassName: AnyClass

    init(lynxElementName: String, lynxElementClassName: AnyClass) {
        self.lynxElementName = lynxElementName
        self.lynxElementClassName = lynxElementClassName
    }
}

struct SPKSwiftVC: UIViewControllerRepresentable {
    var frame: CGRect

    func makeUIViewController(context: Context) -> UINavigationController {
        let url = "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle&hide_status_bar=1&hide_nav_bar=1"
        let context = SPKContext()
        let elements = SparklingLynxElement(lynxElementName: "input", lynxElementClassName: LynxInput.self)
        context.customUIElements = [elements]
        let resolved = Self.resolvedFrame(frame)
        let vc = SPKRouter.create(withURL: url, context: context, frame: resolved)
        let naviVC = UINavigationController(rootViewController: vc)
        naviVC.isNavigationBarHidden = true
        return naviVC
    }

    func updateUIViewController(_ uiViewController: UINavigationController, context: Context) {
        let resolved = Self.resolvedFrame(frame)
        uiViewController.view.frame = CGRect(origin: .zero, size: resolved.size)
        uiViewController.view.setNeedsLayout()
        uiViewController.view.layoutIfNeeded()
    }

    private static func resolvedFrame(_ frame: CGRect) -> CGRect {
        if frame.width > 0, frame.height > 0 {
            return CGRect(origin: .zero, size: frame.size)
        }
        return CGRect(origin: .zero, size: UIScreen.main.bounds.size)
    }
}

struct DemoVC: View {
    var body: some View {
        GeometryReader { geometry in
            SPKSwiftVC(frame: CGRect(origin: .zero, size: geometry.size))
        }
        .background(Color.black)
        .ignoresSafeArea()
    }
}

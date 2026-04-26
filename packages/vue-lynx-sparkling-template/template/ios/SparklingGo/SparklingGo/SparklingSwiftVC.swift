// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Foundation
import SwiftUI
import Sparkling

class SparklingLynxElement: SPKLynxElement {
    var lynxElementName: String
    
    var lynxElementClassName: AnyClass
    
    init(lynxElementName: String, lynxElementClassName: AnyClass) {
        self.lynxElementName = lynxElementName
        self.lynxElementClassName = lynxElementClassName
    }
}

struct SPKSwiftVC: UIViewControllerRepresentable {
    @State private var state_frame: CGRect
    
    init(state_frame: CGRect = .zero) {
        self.state_frame = state_frame
    }
    
    func makeUIViewController(context: Context) -> some UIViewController {
        #if DEBUG
        let url = "hybrid://lynxview?url=http%3A%2F%2Flocalhost%3A5969%2Fmain.lynx.bundle&hide_status_bar=1&hide_nav_bar=1"
        #else
        let url = "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle&hide_status_bar=1&hide_nav_bar=1"
        #endif
        let context = SPKContext()
        let elements = SparklingLynxElement(lynxElementName: "input", lynxElementClassName: LynxInput.self)
        context.customUIElements = [elements]
        let vc = SPKRouter.create(withURL: url, context: context, frame: self.state_frame)
        let naviVC = UINavigationController(rootViewController: vc)
        return naviVC
    }
    
    func updateUIViewController(_ uiViewController: UIViewControllerType, context: Context) {
        
    }
}


struct DemoVC: View {
    var body: some View {
        GeometryReader { geometry in
            SPKSwiftVC(state_frame: geometry.frame(in: .local))
        }
        
    }
}

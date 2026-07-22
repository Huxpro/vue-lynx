// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Foundation
import SwiftUI
import Sparkling
import UIKit

struct SPKSwiftUIView: UIViewRepresentable {

    @State private var rect: CGRect
    
    typealias UIViewType = SPKContainerView
    
    init(rect: CGRect) {
        self.rect = rect
    }
    
    func makeUIView(context: Context) -> SPKContainerView {
        let context = SPKContext()
        
        let view = SPKContainerView(frame: rect)
        
        #if DEBUG
        let url = "hybrid://lynxview?url=http%3A%2F%2Flocalhost%3A5969%2Fmain.lynx.bundle&hide_nav_bar=true&hide_status_bar=true"
        #else
        let url = "hybrid://lynxview?bundle=.%2Fmain.lynx.bundle&hide_nav_bar=true&hide_status_bar=true"
        #endif
        
        view.load(withURL: url, context)
        return view
    }
    
    func updateUIView(_ uiView: Sparkling.SPKContainerView, context: Context) {
        uiView.frame = rect
    }
}

struct DemoView: View {
    var body: some View {
        GeometryReader { geo in
            SPKSwiftUIView(rect: geo.frame(in: .global))
        }
        .navigationBarHidden(true)
        .statusBar(hidden: true)
    }
}



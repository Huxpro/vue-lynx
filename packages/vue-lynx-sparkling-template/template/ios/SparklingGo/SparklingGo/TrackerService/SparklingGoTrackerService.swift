// Copyright (c) 2025 TikTok Pte. Ltd.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import Foundation
import Sparkling

class SparklingGoTrackerService: SPKTrackerService {
    func track(event: SPKTrackerEventKey?, metrics: [AnyHashable : AnyHashable]?, category: [AnyHashable : AnyHashable]?, containerView: UIView?) {
        print("[Event: \(event?.rawValueString ?? "")] \nMetrics: \(metrics ?? [:]) \nCategory: \(category ?? [:]) \n View: \(containerView?.description ?? "")")
    }
}

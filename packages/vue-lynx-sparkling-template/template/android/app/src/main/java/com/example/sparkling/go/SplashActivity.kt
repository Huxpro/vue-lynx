// Copyright (c) 2025 TikTok Pte. Ltd.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
package com.example.sparkling.go

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.tiktok.sparkling.Sparkling
import com.tiktok.sparkling.SparklingContext
import com.tiktok.sparkling.method.registry.core.utils.JsonUtils

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gotoSparklingPage()
    }

    private fun gotoSparklingPage() {
        val initData = mapOf<Any, Any>()
        val initialData: String = JsonUtils.toJson(initData)

        val context = SparklingContext()
        context.scheme = if (BuildConfig.DEBUG) {
            // In debug builds, load from the Rspeedy dev server for hot-reload.
            // 10.0.2.2 is the Android emulator alias for the host machine's localhost.
            "hybrid://lynxview_page?url=http%3A%2F%2F10.0.2.2%3A5969%2Fmain.lynx.bundle&hide_nav_bar=1&screen_orientation=portrait"
        } else {
            "hybrid://lynxview_page?bundle=main.lynx.bundle&hide_nav_bar=1&screen_orientation=portrait"
        }
        context.withInitData("{ \"initial_data\":$initialData}")
        Sparkling.build(this, context).navigate()
        finish()
    }
}

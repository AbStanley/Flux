package com.flux.flux_mobile

import com.flux.flux_mobile.gemma.GemmaPlugin
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GemmaPlugin.registerWith(flutterEngine, this)
    }
}

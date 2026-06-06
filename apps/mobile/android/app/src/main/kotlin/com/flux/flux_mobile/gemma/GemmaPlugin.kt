package com.flux.flux_mobile.gemma

import android.content.Context
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Platform Channel bridge between Flutter/Dart and the native Gemma layer.
 *
 * WHY MethodChannel + EventChannel? MethodChannel handles request/response
 * pairs. EventChannel provides a persistent stream for download progress
 * and token streaming — Flutter's StreamSubscription maps naturally to this.
 */
class GemmaPlugin private constructor(
    private val modelManager: GemmaModelManager,
    private val inferenceEngine: GemmaInferenceEngine,
) : MethodChannel.MethodCallHandler {

    // Coroutine scope tied to plugin lifecycle, not Activity
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var eventSink: EventChannel.EventSink? = null

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "listAvailableModels" -> handleListAvailable(result)
            "listDownloadedModels" -> handleListDownloaded(result)
            "downloadModel" -> handleDownload(call, result)
            "deleteModel" -> handleDelete(call, result)
            "importModelFile" -> handleImportModel(call, result)
            "loadModel" -> handleLoad(call, result)
            "unloadModel" -> handleUnload(result)
            "isModelLoaded" -> result.success(inferenceEngine.isLoaded)
            "generate" -> handleGenerate(call, result)
            "generateStream" -> handleGenerateStream(call, result)
            "cancelGeneration" -> handleCancel(result)
            else -> result.notImplemented()
        }
    }

    private fun handleListAvailable(result: MethodChannel.Result) {
        result.success(GemmaModelRegistry.models.map { it.toMap() })
    }

    private fun handleListDownloaded(result: MethodChannel.Result) {
        result.success(modelManager.listDownloaded())
    }

    private fun handleDownload(call: MethodCall, result: MethodChannel.Result) {
        result.error("DEPRECATED", "Downloads are now handled on the Dart side", null)
    }

    private fun handleDelete(call: MethodCall, result: MethodChannel.Result) {
        val modelId = call.argument<String>("modelId")
        val model = modelId?.let { GemmaModelRegistry.findById(it) }
        if (model == null) return result.error("INVALID_MODEL", "Unknown modelId: $modelId", null)
        result.success(modelManager.deleteModel(model))
    }

    private fun handleImportModel(call: MethodCall, result: MethodChannel.Result) {
        val modelId = call.argument<String>("modelId")
        val filePath = call.argument<String>("filePath")
        val model = modelId?.let { GemmaModelRegistry.findById(it) }
        
        if (model == null) return result.error("INVALID_MODEL", "Unknown modelId: $modelId", null)
        if (filePath.isNullOrBlank()) return result.error("INVALID_ARGS", "filePath is required", null)

        scope.launch {
            modelManager.importModelFile(model, filePath)
                .onSuccess { result.success(true) }
                .onFailure { e -> result.error("IMPORT_FAILED", e.message, null) }
        }
    }

    private fun handleLoad(call: MethodCall, result: MethodChannel.Result) {
        val modelId = call.argument<String>("modelId")
        val model = modelId?.let { GemmaModelRegistry.findById(it) }
        if (model == null) return result.error("INVALID_MODEL", "Unknown modelId: $modelId", null)
        if (!modelManager.isDownloaded(model)) {
            return result.error("NOT_DOWNLOADED", "Model ${model.id} is not downloaded", null)
        }

        scope.launch {
            try {
                inferenceEngine.loadModel(modelManager.modelFile(model).absolutePath)
                result.success(true)
            } catch (e: Exception) {
                result.error("LOAD_FAILED", e.message, null)
            }
        }
    }

    private fun handleUnload(result: MethodChannel.Result) {
        inferenceEngine.unloadModel()
        result.success(true)
    }

    private fun handleGenerate(call: MethodCall, result: MethodChannel.Result) {
        val prompt = call.argument<String>("prompt")
        if (prompt.isNullOrBlank()) return result.error("INVALID_ARGS", "prompt is required", null)

        scope.launch {
            try {
                result.success(inferenceEngine.generate(prompt))
            } catch (e: Exception) {
                result.error("INFERENCE_FAILED", e.message, null)
            }
        }
    }

    private fun handleGenerateStream(call: MethodCall, result: MethodChannel.Result) {
        val prompt = call.argument<String>("prompt")
        if (prompt.isNullOrBlank()) return result.error("INVALID_ARGS", "prompt is required", null)

        result.success(null)

        scope.launch {
            inferenceEngine.generateStream(
                prompt = prompt,
                onToken = { token -> emitEvent(mapOf("type" to "token", "content" to token)) },
                onDone = { emitEvent(mapOf("type" to "done")) },
                onError = { e -> emitEvent(mapOf("type" to "error", "message" to (e.message ?: "Generation failed"))) },
            )
        }
    }

    private fun handleCancel(result: MethodChannel.Result) {
        inferenceEngine.cancelGeneration()
        result.success(true)
    }

    /** Posts events on the main thread — EventSink is not thread-safe. */
    private fun emitEvent(data: Map<String, Any>) {
        scope.launch(Dispatchers.Main) { eventSink?.success(data) }
    }

    fun dispose() {
        inferenceEngine.unloadModel()
        scope.cancel()
    }

    companion object {
        private const val METHOD_CHANNEL = "com.flux.flux_mobile/gemma"
        private const val EVENT_CHANNEL = "com.flux.flux_mobile/gemma_events"

        fun registerWith(flutterEngine: FlutterEngine, context: Context) {
            val manager = GemmaModelManager(context)
            val engine = GemmaInferenceEngine(context)
            val plugin = GemmaPlugin(manager, engine)

            MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL)
                .setMethodCallHandler(plugin)

            EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL)
                .setStreamHandler(object : EventChannel.StreamHandler {
                    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                        plugin.eventSink = events
                    }
                    override fun onCancel(arguments: Any?) {
                        plugin.eventSink = null
                    }
                })
        }
    }
}

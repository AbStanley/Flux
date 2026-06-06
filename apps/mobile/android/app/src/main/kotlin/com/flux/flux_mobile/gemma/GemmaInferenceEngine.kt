package com.flux.flux_mobile.gemma

import android.content.Context
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Conversation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.*
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Native engine wrapper using LiteRT-LM's new unified API.
 *
 * WHY? It manages the AutoCloseable Engine and Conversation sessions,
 * enabling reactive Flow collection for asynchronous token streaming.
 */
class GemmaInferenceEngine(private val context: Context) {

    private var engine: Engine? = null
    private val _isCancelled = AtomicBoolean(false)

    val isLoaded: Boolean get() = engine != null

    /** Loads the model into RAM using GPU acceleration. */
    suspend fun loadModel(modelPath: String) = withContext(Dispatchers.IO) {
        unloadModel()

        val modelFile = File(modelPath)
        if (!modelFile.exists()) {
            throw IllegalArgumentException("Model file not found: $modelPath")
        }

        // Cache dir speeds up subsequent load calls by caching compiled shaders
        val config = EngineConfig(
            modelPath = modelPath,
            backend = Backend.GPU(),
            cacheDir = context.cacheDir.path
        )

        val newEngine = Engine(config)
        newEngine.initialize()
        engine = newEngine
    }

    /** Synchronous full response generator. */
    suspend fun generate(prompt: String): String = withContext(Dispatchers.IO) {
        val currentEngine = engine
            ?: throw IllegalStateException("No model loaded — call loadModel() first")

        var result = ""
        currentEngine.createConversation().use { conversation ->
            conversation.sendMessageAsync(prompt).collect { token ->
                result += token.text
            }
        }
        result
    }

    /** Streams generated tokens reactive-style using Coroutines Flow. */
    suspend fun generateStream(
        prompt: String,
        onToken: (String) -> Unit,
        onDone: () -> Unit,
        onError: (Exception) -> Unit,
    ) = withContext(Dispatchers.IO) {
        val currentEngine = engine
        if (currentEngine == null) {
            onError(IllegalStateException("No model loaded — call loadModel() first"))
            return@withContext
        }

        _isCancelled.set(false)

        try {
            currentEngine.createConversation().use { conversation ->
                conversation.sendMessageAsync(prompt).collect { token ->
                    if (_isCancelled.get()) {
                        throw kotlinx.coroutines.CancellationException("Generation cancelled")
                    }
                    onToken(token.text)
                }
            }
            if (!_isCancelled.get()) {
                onDone()
            }
        } catch (e: Exception) {
            if (!_isCancelled.get()) {
                onError(e)
            }
        }
    }

    fun cancelGeneration() {
        _isCancelled.set(true)
    }

    fun unloadModel() {
        _isCancelled.set(true)
        engine?.close()
        engine = null
    }
}

/** Extension property to safely extract text from a LiteRT-LM Message. */
private val com.google.ai.edge.litertlm.Message.text: String
    get() = contents.contents
        .filterIsInstance<com.google.ai.edge.litertlm.Content.Text>()
        .joinToString("") { it.text }

package com.flux.flux_mobile.gemma

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Manages the model file lifecycle on disk: download, delete, query.
 * All I/O runs on Dispatchers.IO — callers use coroutines.
 */
class GemmaModelManager(private val context: Context) {

    private val modelsDir: File
        get() = File(context.filesDir, "gemma_models").also { it.mkdirs() }

    fun modelFile(model: GemmaModel): File = File(modelsDir, model.fileName)

    fun isDownloaded(model: GemmaModel): Boolean = modelFile(model).exists()

    fun listDownloaded(): List<Map<String, Any>> {
        return GemmaModelRegistry.models
            .filter { isDownloaded(it) }
            .map { it.toMap() + ("downloadedSizeBytes" to modelFile(it).length()) }
    }

    fun deleteModel(model: GemmaModel): Boolean {
        val file = modelFile(model)
        return if (file.exists()) file.delete() else false
    }

    /**
     * Imports a manually downloaded .litertlm file from [sourcePath]
     * to the app's internal gemma_models directory.
     */
    suspend fun importModelFile(model: GemmaModel, sourcePath: String): Result<File> = withContext(Dispatchers.IO) {
        val targetFile = modelFile(model)
        val sourceFile = File(sourcePath)
        
        if (!sourceFile.exists()) {
            return@withContext Result.failure(Exception("Source file does not exist: $sourcePath"))
        }

        try {
            sourceFile.inputStream().buffered().use { input ->
                targetFile.outputStream().buffered().use { output ->
                    input.copyTo(output)
                }
            }
            Result.success(targetFile)
        } catch (e: Exception) {
            targetFile.delete() // Clean up partially copied files
            Result.failure(e)
        }
    }
}

package com.flux.flux_mobile.gemma

/**
 * Domain entity representing a Gemma model variant.
 * Kept separate from infrastructure concerns (download, inference).
 */
data class GemmaModel(
    val id: String,
    val displayName: String,
    val fileName: String,
    val downloadUrl: String,
    val sizeBytes: Long,
    val parameterCount: String,
) {
    fun toMap(): Map<String, Any> = mapOf(
        "id" to id,
        "displayName" to displayName,
        "fileName" to fileName,
        "downloadUrl" to downloadUrl,
        "sizeBytes" to sizeBytes,
        "parameterCount" to parameterCount,
    )
}

/**
 * Registry of all supported Gemma models.
 * Single source of truth — add new variants here.
 */
object GemmaModelRegistry {
    val models: List<GemmaModel> = listOf(
        GemmaModel(
            id = "gemma-4-e2b",
            displayName = "Gemma 4 E2B (2B params)",
            fileName = "gemma-4-E2B-it.litertlm",
            downloadUrl = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm?download=true",
            sizeBytes = 2_588_147_712L,
            parameterCount = "2B",
        ),
        GemmaModel(
            id = "gemma-4-e4b",
            displayName = "Gemma 4 E4B (4B params)",
            fileName = "gemma-4-E4B-it.litertlm",
            downloadUrl = "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm?download=true",
            sizeBytes = 3_659_530_240L,
            parameterCount = "4B",
        ),
    )

    fun findById(id: String): GemmaModel? = models.find { it.id == id }
}

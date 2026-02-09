package com.vocabwallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.*
import android.net.Uri
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import kotlin.random.Random

data class VocabWord(
    val word: String,
    val definition: String,
    val partOfSpeech: String? = null,
    val example: String? = null
)

data class SchedulerData(
    val imageUris: List<String>,
    val currentIndex: Int,
    val vocabWords: List<VocabWord>
)

class VocabWallpaperWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        const val TAG = "VocabWallpaperWorker"
        const val PREFS_NAME = "vocab_wallpaper_prefs"
        const val KEY_IMAGE_URIS = "image_uris"
        const val KEY_CURRENT_INDEX = "current_index"
        const val KEY_VOCAB_WORDS = "vocab_words"
        const val KEY_VOCAB_INDEX = "vocab_index"
    }

    private val gson = Gson()

    override suspend fun doWork(): Result {
        return try {
            Log.d(TAG, "Starting wallpaper update work")
            
            val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            
            // Get stored image URIs
            val imageUrisJson = prefs.getString(KEY_IMAGE_URIS, "[]") ?: "[]"
            val imageUris: List<String> = gson.fromJson(imageUrisJson, object : TypeToken<List<String>>() {}.type)
            
            if (imageUris.isEmpty()) {
                Log.w(TAG, "No images configured")
                return Result.success()
            }

            // Get current image index and rotate
            var currentIndex = prefs.getInt(KEY_CURRENT_INDEX, 0)
            if (currentIndex >= imageUris.size) {
                currentIndex = 0
            }
            val imageUri = imageUris[currentIndex]
            
            // Get vocab words
            val vocabWordsJson = prefs.getString(KEY_VOCAB_WORDS, "[]") ?: "[]"
            val vocabWords: List<VocabWord> = gson.fromJson(vocabWordsJson, object : TypeToken<List<VocabWord>>() {}.type)
            
            if (vocabWords.isEmpty()) {
                Log.w(TAG, "No vocab words configured")
                return Result.success()
            }

            // Get current vocab index and rotate
            var vocabIndex = prefs.getInt(KEY_VOCAB_INDEX, 0)
            if (vocabIndex >= vocabWords.size) {
                vocabIndex = 0
            }
            val vocabWord = vocabWords[vocabIndex]

            // Render the wallpaper with vocab overlay
            val wallpaperBitmap = renderWallpaper(imageUri, vocabWord)
            
            if (wallpaperBitmap != null) {
                // Set as lock screen wallpaper
                val wallpaperManager = WallpaperManager.getInstance(applicationContext)
                wallpaperManager.setBitmap(
                    wallpaperBitmap,
                    null,
                    true,
                    WallpaperManager.FLAG_LOCK
                )
                wallpaperBitmap.recycle()
                
                // Update indices for next time
                prefs.edit()
                    .putInt(KEY_CURRENT_INDEX, (currentIndex + 1) % imageUris.size)
                    .putInt(KEY_VOCAB_INDEX, (vocabIndex + 1) % vocabWords.size)
                    .apply()
                
                Log.d(TAG, "Wallpaper updated successfully with word: ${vocabWord.word}")
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error updating wallpaper", e)
            Result.retry()
        }
    }

    private fun renderWallpaper(imageUri: String, vocabWord: VocabWord): Bitmap? {
        try {
            val inputStream: InputStream = when {
                imageUri.startsWith("content://") -> {
                    applicationContext.contentResolver.openInputStream(Uri.parse(imageUri))
                        ?: return null
                }
                imageUri.startsWith("file://") -> {
                    FileInputStream(File(imageUri.removePrefix("file://")))
                }
                imageUri.startsWith("/") -> {
                    FileInputStream(File(imageUri))
                }
                else -> return null
            }

            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (originalBitmap == null) return null

            // Create mutable copy for drawing
            val mutableBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
            originalBitmap.recycle()

            val canvas = Canvas(mutableBitmap)
            val width = mutableBitmap.width.toFloat()
            val height = mutableBitmap.height.toFloat()

            // Draw semi-transparent background for text
            val bgPaint = Paint().apply {
                color = Color.parseColor("#B3000000") // 70% black
                style = Paint.Style.FILL
            }
            val bgTop = height * 0.65f
            val bgBottom = height * 0.95f
            canvas.drawRect(0f, bgTop, width, bgBottom, bgPaint)

            // Draw word
            val wordPaint = Paint().apply {
                color = Color.WHITE
                textSize = width * 0.08f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            val wordY = bgTop + (bgBottom - bgTop) * 0.25f
            canvas.drawText(vocabWord.word, width * 0.05f, wordY, wordPaint)

            // Draw part of speech if available
            var currentY = wordY
            if (!vocabWord.partOfSpeech.isNullOrEmpty()) {
                val posPaint = Paint().apply {
                    color = Color.parseColor("#AAAAAA")
                    textSize = width * 0.04f
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
                    isAntiAlias = true
                }
                currentY += width * 0.06f
                canvas.drawText("(${vocabWord.partOfSpeech})", width * 0.05f, currentY, posPaint)
            }

            // Draw definition (wrapped if needed)
            val defPaint = Paint().apply {
                color = Color.WHITE
                textSize = width * 0.045f
                isAntiAlias = true
            }
            currentY += width * 0.07f
            
            // Simple text wrapping
            val maxWidth = width * 0.9f
            val words = vocabWord.definition.split(" ")
            var line = ""
            for (word in words) {
                val testLine = if (line.isEmpty()) word else "$line $word"
                if (defPaint.measureText(testLine) > maxWidth) {
                    canvas.drawText(line, width * 0.05f, currentY, defPaint)
                    currentY += width * 0.055f
                    line = word
                } else {
                    line = testLine
                }
            }
            if (line.isNotEmpty()) {
                canvas.drawText(line, width * 0.05f, currentY, defPaint)
            }

            return mutableBitmap
        } catch (e: Exception) {
            Log.e(TAG, "Error rendering wallpaper", e)
            return null
        }
    }
}

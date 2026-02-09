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
            
            // Use smaller of width/height to scale text proportionally
            val scale = minOf(width, height)

            // Draw semi-transparent background for text (lower portion of screen)
            val bgPaint = Paint().apply {
                color = Color.parseColor("#CC000000") // 80% black for better readability
                style = Paint.Style.FILL
            }
            val bgTop = height * 0.72f
            val bgBottom = height
            canvas.drawRect(0f, bgTop, width, bgBottom, bgPaint)

            // Padding from edges
            val paddingX = width * 0.04f

            // Draw word - smaller font
            val wordPaint = Paint().apply {
                color = Color.WHITE
                textSize = scale * 0.05f  // Reduced from 0.08f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            var currentY = bgTop + scale * 0.06f
            canvas.drawText(vocabWord.word, paddingX, currentY, wordPaint)

            // Draw part of speech if available
            if (!vocabWord.partOfSpeech.isNullOrEmpty()) {
                val posPaint = Paint().apply {
                    color = Color.parseColor("#CCCCCC")
                    textSize = scale * 0.025f  // Reduced from 0.04f
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
                    isAntiAlias = true
                }
                currentY += scale * 0.035f
                canvas.drawText("(${vocabWord.partOfSpeech})", paddingX, currentY, posPaint)
            }

            // Draw definition (wrapped to fit screen width)
            val defPaint = Paint().apply {
                color = Color.WHITE
                textSize = scale * 0.028f  // Reduced from 0.045f
                isAntiAlias = true
            }
            currentY += scale * 0.045f
            
            // Text wrapping with proper line height
            val maxWidth = width - (paddingX * 2)
            val lineHeight = scale * 0.035f
            val words = vocabWord.definition.split(" ")
            var line = ""
            var linesDrawn = 0
            val maxLines = 4  // Limit lines to prevent overflow
            
            for (word in words) {
                val testLine = if (line.isEmpty()) word else "$line $word"
                if (defPaint.measureText(testLine) > maxWidth) {
                    if (linesDrawn < maxLines) {
                        canvas.drawText(line, paddingX, currentY, defPaint)
                        currentY += lineHeight
                        linesDrawn++
                    }
                    line = word
                } else {
                    line = testLine
                }
            }
            // Draw remaining text
            if (line.isNotEmpty() && linesDrawn < maxLines) {
                if (linesDrawn == maxLines - 1 && words.size > 10) {
                    // Truncate with ellipsis if we're at max lines
                    line = line.take(40) + "..."
                }
                canvas.drawText(line, paddingX, currentY, defPaint)
            }

            return mutableBitmap
        } catch (e: Exception) {
            Log.e(TAG, "Error rendering wallpaper", e)
            return null
        }
    }
}

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
        const val KEY_TEXT_COLOR = "text_color"
        const val KEY_FONT_SIZE_MULTIPLIER = "font_size_multiplier"
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

            // Get text appearance settings
            val textColor = prefs.getString(KEY_TEXT_COLOR, "#FFFFFF") ?: "#FFFFFF"
            val fontSizeMultiplier = prefs.getFloat(KEY_FONT_SIZE_MULTIPLIER, 1.0f)

            // Render the wallpaper with vocab overlay
            val wallpaperBitmap = renderWallpaper(imageUri, vocabWord, textColor, fontSizeMultiplier)
            
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

    private fun renderWallpaper(
        imageUri: String, 
        vocabWord: VocabWord,
        textColor: String,
        fontSizeMultiplier: Float
    ): Bitmap? {
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

            // Parse the text color
            val parsedTextColor = try {
                Color.parseColor(textColor)
            } catch (e: Exception) {
                Color.WHITE
            }

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

            // Base sizes (will be multiplied by fontSizeMultiplier)
            val baseWordSize = scale * 0.05f
            val basePosSize = scale * 0.025f
            val baseDefSize = scale * 0.028f
            val baseLineHeight = scale * 0.035f

            // Draw word
            val wordPaint = Paint().apply {
                color = parsedTextColor
                textSize = baseWordSize * fontSizeMultiplier
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            var currentY = bgTop + scale * 0.06f * fontSizeMultiplier
            canvas.drawText(vocabWord.word, paddingX, currentY, wordPaint)

            // Draw part of speech if available
            if (!vocabWord.partOfSpeech.isNullOrEmpty()) {
                val posPaint = Paint().apply {
                    // Slightly dimmer version of text color for part of speech
                    color = adjustColorAlpha(parsedTextColor, 0.7f)
                    textSize = basePosSize * fontSizeMultiplier
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
                    isAntiAlias = true
                }
                currentY += scale * 0.035f * fontSizeMultiplier
                canvas.drawText("(${vocabWord.partOfSpeech})", paddingX, currentY, posPaint)
            }

            // Draw definition (wrapped to fit screen width)
            val defPaint = Paint().apply {
                color = parsedTextColor
                textSize = baseDefSize * fontSizeMultiplier
                isAntiAlias = true
            }
            currentY += scale * 0.045f * fontSizeMultiplier
            
            // Text wrapping with proper line height
            val maxWidth = width - (paddingX * 2)
            val lineHeight = baseLineHeight * fontSizeMultiplier
            val words = vocabWord.definition.split(" ")
            var line = ""
            var linesDrawn = 0
            val maxLines = if (fontSizeMultiplier > 1.0f) 3 else 4  // Fewer lines for larger text
            
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

    private fun adjustColorAlpha(color: Int, factor: Float): Int {
        val alpha = (Color.alpha(color) * factor).toInt()
        val red = Color.red(color)
        val green = Color.green(color)
        val blue = Color.blue(color)
        return Color.argb(alpha, red, green, blue)
    }
}

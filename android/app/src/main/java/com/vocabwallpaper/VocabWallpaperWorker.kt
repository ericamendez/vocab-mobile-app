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

            // Parse the text color
            val parsedTextColor = try {
                Color.parseColor(textColor)
            } catch (e: Exception) {
                Color.WHITE
            }

            // Calculate text area - bottom 25% of screen
            val paddingX = width * 0.05f
            val availableWidth = width - (paddingX * 2)
            val bgTop = height * 0.75f
            val bgBottom = height
            val textAreaHeight = bgBottom - bgTop

            // Draw semi-transparent background for text
            val bgPaint = Paint().apply {
                color = Color.parseColor("#CC000000")
                style = Paint.Style.FILL
            }
            canvas.drawRect(0f, bgTop, width, bgBottom, bgPaint)

            // Calculate font sizes based on available width (not height)
            // This ensures text always fits horizontally
            val wordSize = availableWidth * 0.08f * fontSizeMultiplier
            val posSize = availableWidth * 0.04f * fontSizeMultiplier
            val defSize = availableWidth * 0.045f * fontSizeMultiplier

            // Draw word
            val wordPaint = Paint().apply {
                color = parsedTextColor
                textSize = wordSize
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            
            // Start text at top of background area with some padding
            var currentY = bgTop + wordSize + (textAreaHeight * 0.05f)
            canvas.drawText(vocabWord.word, paddingX, currentY, wordPaint)

            // Draw part of speech if available
            if (!vocabWord.partOfSpeech.isNullOrEmpty()) {
                val posPaint = Paint().apply {
                    color = adjustColorAlpha(parsedTextColor, 0.7f)
                    textSize = posSize
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
                    isAntiAlias = true
                }
                currentY += posSize + 4
                canvas.drawText("(${vocabWord.partOfSpeech})", paddingX, currentY, posPaint)
            }

            // Draw definition with proper word wrapping
            val defPaint = Paint().apply {
                color = parsedTextColor
                textSize = defSize
                isAntiAlias = true
            }
            
            currentY += defSize + 8
            val lineHeight = defSize * 1.3f
            
            // Calculate how many lines we can fit
            val remainingHeight = bgBottom - currentY - 20  // 20px bottom padding
            val maxLines = maxOf(1, (remainingHeight / lineHeight).toInt())
            
            // Wrap text properly
            val lines = wrapText(vocabWord.definition, defPaint, availableWidth, maxLines)
            
            for ((index, line) in lines.withIndex()) {
                var textToDraw = line
                // Add ellipsis to last line if we truncated
                if (index == lines.size - 1 && index == maxLines - 1 && 
                    vocabWord.definition.length > lines.joinToString(" ").length) {
                    // Trim and add ellipsis
                    while (defPaint.measureText("$textToDraw...") > availableWidth && textToDraw.isNotEmpty()) {
                        textToDraw = textToDraw.dropLast(1)
                    }
                    textToDraw = "$textToDraw..."
                }
                canvas.drawText(textToDraw, paddingX, currentY, defPaint)
                currentY += lineHeight
            }

            return mutableBitmap
        } catch (e: Exception) {
            Log.e(TAG, "Error rendering wallpaper", e)
            return null
        }
    }

    private fun wrapText(text: String, paint: Paint, maxWidth: Float, maxLines: Int): List<String> {
        val words = text.split(" ")
        val lines = mutableListOf<String>()
        var currentLine = ""

        for (word in words) {
            if (lines.size >= maxLines) break
            
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            
            if (paint.measureText(testLine) <= maxWidth) {
                currentLine = testLine
            } else {
                if (currentLine.isNotEmpty()) {
                    lines.add(currentLine)
                    if (lines.size >= maxLines) break
                }
                // Handle words that are too long for one line
                if (paint.measureText(word) > maxWidth) {
                    currentLine = word.take((word.length * 0.8).toInt())
                } else {
                    currentLine = word
                }
            }
        }
        
        if (currentLine.isNotEmpty() && lines.size < maxLines) {
            lines.add(currentLine)
        }
        
        return lines
    }

    private fun adjustColorAlpha(color: Int, factor: Float): Int {
        val alpha = (Color.alpha(color) * factor).toInt()
        val red = Color.red(color)
        val green = Color.green(color)
        val blue = Color.blue(color)
        return Color.argb(alpha, red, green, blue)
    }
}

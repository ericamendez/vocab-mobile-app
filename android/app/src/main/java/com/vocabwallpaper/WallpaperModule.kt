package com.vocabwallpaper

import android.app.WallpaperManager
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.InputStream

class WallpaperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WallpaperModule"

    @ReactMethod
    fun setWallpaper(imageUri: String, target: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val wallpaperManager = WallpaperManager.getInstance(context)
            
            val inputStream: InputStream = when {
                imageUri.startsWith("content://") -> {
                    context.contentResolver.openInputStream(Uri.parse(imageUri))
                        ?: throw Exception("Cannot open content URI")
                }
                imageUri.startsWith("file://") -> {
                    FileInputStream(File(imageUri.removePrefix("file://")))
                }
                imageUri.startsWith("/") -> {
                    FileInputStream(File(imageUri))
                }
                else -> throw Exception("Unsupported URI scheme: $imageUri")
            }

            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val flag = when (target) {
                    "lock_screen" -> WallpaperManager.FLAG_LOCK
                    "home_screen" -> WallpaperManager.FLAG_SYSTEM
                    "both" -> WallpaperManager.FLAG_LOCK or WallpaperManager.FLAG_SYSTEM
                    else -> WallpaperManager.FLAG_LOCK
                }
                wallpaperManager.setBitmap(bitmap, null, true, flag)
            } else {
                // Pre-Nougat: can only set system wallpaper
                wallpaperManager.setBitmap(bitmap)
            }

            bitmap.recycle()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WALLPAPER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isSupported(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.N)
    }

    @ReactMethod
    fun getMinimumSize(promise: Promise) {
        try {
            val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)
            val result = com.facebook.react.bridge.Arguments.createMap()
            result.putInt("width", wallpaperManager.desiredMinimumWidth)
            result.putInt("height", wallpaperManager.desiredMinimumHeight)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SIZE_ERROR", e.message, e)
        }
    }
}

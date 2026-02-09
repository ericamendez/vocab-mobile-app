package com.vocabwallpaper

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.work.*
import com.facebook.react.bridge.*
import com.google.gson.Gson
import java.util.concurrent.TimeUnit

class SchedulerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val WORK_NAME = "vocab_wallpaper_work"
        const val PREFS_NAME = "vocab_wallpaper_prefs"
        const val KEY_SCREEN_WAKE_ENABLED = "screen_wake_enabled"
    }

    private val gson = Gson()
    private var screenWakeReceiver: ScreenWakeReceiver? = null

    override fun getName(): String = "SchedulerModule"

    @ReactMethod
    fun startScheduler(intervalMinutes: Int, promise: Promise) {
        try {
            val workManager = WorkManager.getInstance(reactApplicationContext)

            // Cancel any existing work
            workManager.cancelUniqueWork(WORK_NAME)

            // Create periodic work request
            val workRequest = PeriodicWorkRequestBuilder<VocabWallpaperWorker>(
                intervalMinutes.toLong(), TimeUnit.MINUTES
            )
                .setConstraints(
                    Constraints.Builder()
                        .setRequiresBatteryNotLow(true)
                        .build()
                )
                .build()

            workManager.enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.REPLACE,
                workRequest
            )

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopScheduler(promise: Promise) {
        try {
            val workManager = WorkManager.getInstance(reactApplicationContext)
            workManager.cancelUniqueWork(WORK_NAME)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun triggerNow(promise: Promise) {
        try {
            val workManager = WorkManager.getInstance(reactApplicationContext)
            
            val workRequest = OneTimeWorkRequestBuilder<VocabWallpaperWorker>()
                .build()

            workManager.enqueue(workRequest)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setImageUris(imageUris: ReadableArray, promise: Promise) {
        try {
            val uriList = mutableListOf<String>()
            for (i in 0 until imageUris.size()) {
                imageUris.getString(i)?.let { uriList.add(it) }
            }

            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(VocabWallpaperWorker.KEY_IMAGE_URIS, gson.toJson(uriList))
                .putInt(VocabWallpaperWorker.KEY_CURRENT_INDEX, 0)
                .apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setVocabWords(vocabWords: ReadableArray, promise: Promise) {
        try {
            val wordList = mutableListOf<VocabWord>()
            for (i in 0 until vocabWords.size()) {
                vocabWords.getMap(i)?.let { map ->
                    wordList.add(
                        VocabWord(
                            word = map.getString("word") ?: "",
                            definition = map.getString("definition") ?: "",
                            partOfSpeech = map.getString("partOfSpeech"),
                            example = map.getString("example")
                        )
                    )
                }
            }

            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(VocabWallpaperWorker.KEY_VOCAB_WORDS, gson.toJson(wordList))
                .putInt(VocabWallpaperWorker.KEY_VOCAB_INDEX, 0)
                .apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val workManager = WorkManager.getInstance(reactApplicationContext)
            val workInfo = workManager.getWorkInfosForUniqueWork(WORK_NAME).get()

            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val screenWakeEnabled = prefs.getBoolean(KEY_SCREEN_WAKE_ENABLED, false)

            val result = Arguments.createMap()
            if (workInfo.isNotEmpty()) {
                val info = workInfo[0]
                result.putBoolean("isScheduled", info.state == WorkInfo.State.ENQUEUED || info.state == WorkInfo.State.RUNNING)
                result.putString("state", info.state.name)
            } else {
                result.putBoolean("isScheduled", false)
                result.putString("state", "NONE")
            }
            result.putBoolean("screenWakeEnabled", screenWakeEnabled)

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun enableScreenWakeMode(promise: Promise) {
        try {
            // Save preference
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(KEY_SCREEN_WAKE_ENABLED, true).apply()

            // Register receiver if not already registered
            if (screenWakeReceiver == null) {
                screenWakeReceiver = ScreenWakeReceiver()
                val filter = IntentFilter(Intent.ACTION_SCREEN_ON)
                reactApplicationContext.registerReceiver(screenWakeReceiver, filter)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun disableScreenWakeMode(promise: Promise) {
        try {
            // Save preference
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(KEY_SCREEN_WAKE_ENABLED, false).apply()

            // Unregister receiver if registered
            screenWakeReceiver?.let {
                try {
                    reactApplicationContext.unregisterReceiver(it)
                } catch (e: Exception) {
                    // Receiver may not be registered
                }
                screenWakeReceiver = null
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULER_ERROR", e.message, e)
        }
    }
}

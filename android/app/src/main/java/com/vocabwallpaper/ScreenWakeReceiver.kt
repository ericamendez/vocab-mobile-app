package com.vocabwallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class ScreenWakeReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "ScreenWakeReceiver"
        const val PREFS_NAME = "vocab_wallpaper_prefs"
        const val KEY_SCREEN_WAKE_ENABLED = "screen_wake_enabled"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_SCREEN_ON) {
            Log.d(TAG, "Screen turned on")
            
            // Check if screen wake mode is enabled
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isEnabled = prefs.getBoolean(KEY_SCREEN_WAKE_ENABLED, false)
            
            if (isEnabled) {
                Log.d(TAG, "Screen wake mode enabled, triggering wallpaper update")
                
                // Trigger wallpaper update
                val workRequest = OneTimeWorkRequestBuilder<VocabWallpaperWorker>()
                    .build()
                
                WorkManager.getInstance(context).enqueue(workRequest)
            }
        }
    }
}

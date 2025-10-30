package com.tha.proverbquiz     // TODO 변경 필요

import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "ProverbQuiz"   // TODO 변경 필요

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // ✅ edge-to-edge layout 활성화
    WindowCompat.setDecorFitsSystemWindows(window, false)
  }
}
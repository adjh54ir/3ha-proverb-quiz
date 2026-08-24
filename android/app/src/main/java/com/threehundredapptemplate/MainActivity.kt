package com.tha.proverbquiz     // TODO 변경 필요

import android.media.AudioManager
import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "ProverbQuiz"   // TODO 변경 필요

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme) // ← 추가
    super.onCreate(savedInstanceState)

    // ✅ edge-to-edge layout 활성화
    WindowCompat.setDecorFitsSystemWindows(window, false)

    // 볼륨 버튼이 미디어(음악) 볼륨을 조절하게 고정한다.
    // 이 설정이 없으면 재생 중이 아닐 때 볼륨 버튼이 벨소리 볼륨을 잡는다.
    // 효과음은 0.1~1.7초라 "누를 틈도 없이" 끝나서 미디어 볼륨을 올릴 방법이 없었다.
    volumeControlStream = AudioManager.STREAM_MUSIC
  }
}
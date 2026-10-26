package com.tha.proverbquiz     // TODO 변경 필요

import android.media.AudioManager
import android.os.Bundle
import android.view.KeyEvent
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

  // 외장 키보드 단축키 — 입력창이 먹지 않은 키만 여기까지 온다.
  // 퀴즈 보기 1~4 와 Enter 만 JS 로 넘긴다 (받는 쪽: src/utils/HardwareKeys.ts).
  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    val key = when (keyCode) {
      KeyEvent.KEYCODE_1, KeyEvent.KEYCODE_NUMPAD_1 -> "1"
      KeyEvent.KEYCODE_2, KeyEvent.KEYCODE_NUMPAD_2 -> "2"
      KeyEvent.KEYCODE_3, KeyEvent.KEYCODE_NUMPAD_3 -> "3"
      KeyEvent.KEYCODE_4, KeyEvent.KEYCODE_NUMPAD_4 -> "4"
      KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> "enter"
      else -> null
    }
    val context = reactActivityDelegate.currentReactContext
    if (key == null || event.hasModifiers() || context == null) {
      return super.onKeyUp(keyCode, event)
    }
    context.emitDeviceEvent("hardwareKey", key)
    return true
  }
}
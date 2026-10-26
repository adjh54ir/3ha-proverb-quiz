import Firebase
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import RNBootSplash // ← 추가
import UIKit

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    self.moduleName = "ProverbQuiz"  // TODO 변경 필요
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    FirebaseApp.configure()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

   // ✅ 해당 부분 추가
  override func customize(_ rootView: RCTRootView!) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }


  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      // 8082 포트로 변경
      // return URL(string: "http://localhost:8082/index.bundle?platform=ios&dev=true")
      RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  // ✅ 수정된 부분
  override func application(
    _ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    return .portrait
  }

  // 외장 키보드 단축키를 받는 루트 화면 (아래 HardwareKeyViewController)
  override func createRootViewController() -> UIViewController {
    HardwareKeyViewController()
  }
}

/// 외장 키보드(아이패드 매직 키보드 등) 단축키.
/// 입력창이 먹지 않은 키만 응답 체인을 타고 루트 화면까지 올라온다 — 퀴즈 보기 1~4 와 Enter 만 골라
/// 알림으로 보내면 HardwareKeyEmitter.m 이 JS 'hardwareKey' 이벤트로 넘긴다 (받는 쪽: src/utils/HardwareKeys.ts).
final class HardwareKeyViewController: UIViewController {
  private static let keys: [UIKeyboardHIDUsage: String] = [
    .keyboard1: "1", .keyboard2: "2", .keyboard3: "3", .keyboard4: "4",
    .keypad1: "1", .keypad2: "2", .keypad3: "3", .keypad4: "4",
    .keyboardReturnOrEnter: "enter", .keypadEnter: "enter",
  ]

  override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
    for press in presses {
      guard let pressed = press.key, let key = Self.keys[pressed.keyCode],
        pressed.modifierFlags.intersection([.command, .control, .alternate]).isEmpty
      else { continue }
      NotificationCenter.default.post(name: Notification.Name("HardwareKeyPressed"), object: nil, userInfo: ["key": key])
    }
    super.pressesBegan(presses, with: event)
  }
}

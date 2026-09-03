1. 전반적으로 선호하는 UI 디자인은 모던하고 깔끔한 스타일을 좋아해.

2. 그리고 애니메이션 효과를 넣어서 사용자가 심심하지 않게 제공을 해줬으면 좋겠어

3. 내가 가장 중요하게 생각하는 디자인은 좌우 간격, 위아래 간격을 항상 중요시하니까 꼭 디자인 작업시 명심할것.

## 모달 레이아웃 규칙

`AppModal`(`src/screens/common/atomic/AppModal.tsx`)은 딤이 잘리지 않도록 상태바·내비게이션바를 포함한
`Dimensions.get('screen')` 크기로 깔린다. 그래서 그 안에서 가운데 정렬한 카드는 시스템 바 밑까지 파고든다.
모달을 새로 만들거나 고칠 때 아래를 지킬 것.

1. 오버레이(딤)에는 항상 `useModalSafePadding()` 을 붙인다. 딤은 화면 끝까지 유지되고 카드만 시스템 바를 피한다.

   ```tsx
   const safePadding = useModalSafePadding();
   <View style={[styles.overlay, safePadding]}>
   ```

2. 카드 높이는 `maxHeight: '100%'` 를 기본으로 한다. 여백을 뺀 실제 가용 높이에 맞춰 스스로 줄어든다.
   `'85%'` 같은 퍼센트도 안전 영역 기준으로 계산되므로 괜찮다.

3. 세로 크기에 `scaleHeight(고정값)` 을 쓰지 않는다. `scaleHeight` 는 `값 × min(기기 높이 / 812, 상한)`
   이라서 화면 높이에 비례한다. 즉 `scaleHeight(700)` 은 상수가 아니라 "화면 높이의 86%"(상한에 걸리기
   전까지)이고, 큰 기기에서 카드가 같이 커져 위아래가 잘린다.
   세로는 퍼센트로, `scaleHeight` 는 아이콘·이미지 같은 작은 고정 요소에만.
   상한은 폰 `MAX_SCALE = 1.25` / 태블릿 `TABLET_MAX_SCALE = 1.35` 이고 가로·세로·폰트가 같은 값을
   쓴다 (`src/utils/DementionUtils.ts`, 아래 "태블릿/아이패드 반응형 규칙" 참고).

4. 카드 높이를 직접 계산하는 모달(예: `TowerResultModal`)은 오버레이 패딩이 먹지 않는다.
   그런 경우는 계산식에서 insets 를 빼야 한다
   (`(height - safePadding.paddingTop - safePadding.paddingBottom) * 0.8`).

5. 테스트에서 모달을 `SafeAreaProvider` 없이 렌더하면 `useSafeAreaInsets` 가 throw 한다.
   `jest.setup.js` 에 `react-native-safe-area-context/jest/mock` 이 등록돼 있으니 그대로 두면 된다.

## 태블릿/아이패드 반응형 규칙

전제는 하나다 — **폰 레이아웃은 바뀌지 않는다.** 태블릿 전용 레이아웃을 따로 짜지 않고
배율 상한 + 본문 기둥 폭 두 가지로 처리한다. 값은 모두 `src/utils/DementionUtils.ts` 에 있다.

1. 태블릿 판정은 `isTablet` (짧은 변 600dp 이상, 안드로이드 sw600dp 와 동일 기준) 하나만 쓴다.
   화면에서 `screenWidth > 600` 이나 `DeviceInfo.isTablet()` 을 새로 만들지 않는다.
   판정은 창(`window`)이 아니라 기기(`screen`) 기준이다 — 분할 화면에서 값이 흔들리지 않게.

2. `scaleWidth` / `scaleHeight` / `scaledSize` 의 배율에는 상한이 있다.
   폰 `MAX_SCALE = 1.25`, 태블릿 `TABLET_MAX_SCALE = 1.35`.
   태블릿이 너무 작거나 크게 느껴지면 **레이아웃을 새로 짜기 전에 이 값부터** 조정한다.

3. 화면 본문은 `AppLayout` 의 `navigatorWrapper` 가 `CONTENT_MAX_WIDTH` 로 묶고 가운데 정렬한다.
   화면 코드에서 따로 폭을 제한할 필요가 없다.

4. 모달 카드 폭은 `maxWidth` 를 반드시 준다.
   - 가운데 뜨는 다이얼로그: `scaleWidth(340)` 계열 또는 `MODAL_MAX_WIDTH`
   - 바텀시트·전체폭 카드: `CONTENT_MAX_WIDTH` + `alignSelf: 'center'`
   `width: '100%'` 만 두면 아이패드에서 카드가 화면 폭을 다 먹어 대화상자로 읽히지 않는다.

5. 네이티브 스위치 네 개가 세트다 (`__tests__/tabletLayout.test.ts` 가 확인한다).
   - `TARGETED_DEVICE_FAMILY = "1,2"` (Debug/Release 둘 다)
   - `UIRequiresFullScreen` = true (멀티태스킹을 지원하면 애플이 4방향 회전을 요구한다)
   - `UISupportedInterfaceOrientations~ipad` = Portrait 만
   - Android `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY` = true
     (targetSdk 36 부터 sw600dp 이상에서 `screenOrientation` 이 무시된다. targetSdk 37 부터는
     이 속성도 무효라 그때는 가로 대응 레이아웃이 필요하다.)

## TextInput / 키보드 규칙

1. 스크롤·빈 영역 탭으로 키보드를 닫는 동작과 iOS 키보드 인셋은 **전역 기본값**이다
   (`src/utils/ScrollDefaults.ts`, `index.js` 최상단에서 import).
   화면에서 `keyboardDismissMode` / `keyboardShouldPersistTaps` /
   `automaticallyAdjustKeyboardInsets` 를 다시 붙이지 않는다.

2. `KeyboardAvoidingView` 의 `behavior` 는 **항상 `"padding"`** 이다.
   `Platform.OS === 'ios' ? 'padding' : 'height'` 를 쓰지 않는다 — 이유는
   `src/screens/common/modal/README.md` 참고 (edge-to-edge / 바텀시트 하단 잘림).

3. 스크롤 영역이 없는 카드형 모달은 딤에 `Keyboard.dismiss` 를 붙인다.
   `<Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />`

## 진동/햅틱 금지

이 앱은 진동 피드백을 쓰지 않는다. `Vibration` API·햅틱 라이브러리를 넣지 않고,
notifee `createChannel` 에는 **반드시 `vibration: false`** 를 준다(기본값이 `true` 다).

안드로이드 알림 채널은 생성 후 설정이 불변이다. 채널 설정을 바꿀 때는 ID 에 버전을 올리고
(`quiz-reminder-v2`) 구버전 채널을 `deleteLegacyVibrationChannels()` 처럼 지워야 기존 사용자에게 반영된다.
`__tests__/noHaptics.test.ts` 가 세 가지(코드/채널/매니페스트 권한)를 모두 확인한다.

## 애니메이션 부담 규칙

끝나지 않는 루프(`Animated.loop`)와 컨페티는 `useReducedMotion()` 으로 반드시 게이트한다.
OS '애니메이션 줄이기'를 켠 사용자에게는 **정보를 잃지 않는 선에서 모션만** 뺀다
(예: 퀴즈 타이머 깜빡임은 빼도 숫자 타이머가 남는다, 결과 모달은 최종 상태로 바로 세운다).

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

6. iOS(Fabric) 에서 테두리 있는 카드가 `scale` 로 등장할 때(`useModalEnter`) 첫 노출에만 흰 배경이
   테두리보다 작게(95%) 그려지는 건 RN 0.78 의 `RCTViewComponentView` 버그다.
   `scripts/patch-rn-view-bg.js`(postinstall) 가 업스트림 수정을 백포트한다.

7. 그와 별개로 **`scale` 이 걸리는 테두리 뷰에는 `overflow: 'hidden'` 을 반드시 준다.**
   iOS 는 테두리를 내용 뒤에 그려야 할 때(CSS 방식) 배경색을 뷰 레이어가 아니라 별도 서브레이어로
   그리는데, 그 서브레이어가 규칙 6 의 버그를 타는 경로다. `clipsToBounds`(= `overflow: 'hidden'`) 면
   CoreAnimation 테두리 경로로 넘어가 서브레이어가 아예 생기지 않는다.
   모달 카드만의 문제가 아니다 — 플립 카드·토스트처럼 `scale` 로 등장하는 화면 안 카드도 같다.
   `scale` 이 1 에서 시작해 첫 프레임이 멀쩡한 경우도 예외로 두지 않는다(판단 비용이 더 크다).
   `__tests__/modalLayoutRules.test.ts` 가 `src` 전체에서 세 갈래를 훑는다 —
   style 안의 `scale:`, `useModalEnter`/`useModalEnterExit` 결과를 얹은 뷰, `PopInView` 로 감싼 카드.

## 태블릿/아이패드 반응형 규칙

**iPad 배포 중이다** — `TARGETED_DEVICE_FAMILY = "1,2"` (Debug/Release 둘 다).
보류로 돌릴 때는 `1` 로 내리고 `__tests__/tabletLayout.test.ts` 의 타깃 테스트만 뒤집으면 된다.
안드로이드 태블릿은 Play 에서 배제할 수 없어 어차피 계속 설치되고(배율 상한이 없으면 1024dp 에서
2.5배로 깨진다), 폰에서는 반응형 코드가 전부 no-op 이라 유지 비용이 0 이다.

전제는 하나다 — **폰 레이아웃은 바뀌지 않는다.** 태블릿 전용 레이아웃을 따로 짜지 않고
배율 상한 + 본문 기둥 폭 두 가지로 처리한다. 값은 모두 `src/utils/DementionUtils.ts` 에 있다.

1. 태블릿 판정은 `isTablet` (짧은 변 600dp 이상, 안드로이드 sw600dp 와 동일 기준) 하나만 쓴다.
   화면에서 `screenWidth > 600` 이나 `DeviceInfo.isTablet()` 을 새로 만들지 않는다.
   판정은 창(`window`)이 아니라 기기(`screen`) 기준이다 — 분할 화면에서 값이 흔들리지 않게.

2. `scaleWidth` / `scaleHeight` / `scaledSize` 의 배율에는 상한이 있다.
   폰 `MAX_SCALE = 1.25`, 태블릿 `TABLET_MAX_SCALE = 1.35`.
   태블릿이 너무 작거나 크게 느껴지면 **레이아웃을 새로 짜기 전에 이 값부터** 조정한다.
   예외 하나 — 짧은 변 1000dp 이상(13인치)은 글씨·아이콘(`scaledSize`)만 `LARGE_TABLET_FONT_SCALE = 1.45`.

3. 화면 본문은 `AppLayout` 의 `navigatorWrapper` 가 `CONTENT_MAX_WIDTH` 로 묶고 가운데 정렬한다.
   화면 코드에서 따로 폭을 제한할 필요가 없다. 기둥은 짧은 변 × 0.92, 최대 900 이다.
   카드형 목록은 태블릿에서 2열이다 — `src/const/common/ListGrid.ts` 의 `LIST_COLUMNS` / `listGrid`
   (`numColumns` + `columnWrapperStyle={listGrid?.row}`, 셀 `AnimatedListItem style={listGrid?.cell}`, 카드에 `listGrid?.fill`).

4. 모달 카드 폭은 `maxWidth` 를 반드시 준다.
   - 가운데 뜨는 다이얼로그: `scaleWidth(340)` 계열 또는 `MODAL_MAX_WIDTH`
   - 바텀시트·전체폭 카드: `CONTENT_MAX_WIDTH` + `alignSelf: 'center'`
   `width: '100%'` 만 두면 아이패드에서 카드가 화면 폭을 다 먹어 대화상자로 읽히지 않는다.

5. 네이티브 스위치 네 개가 세트다 (`__tests__/tabletLayout.test.ts` 가 확인한다).
   - `TARGETED_DEVICE_FAMILY` — 지금은 `"1,2"` (iPad 배포 중), Debug/Release 둘 다. 보류로 돌릴 때 `1`.
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

## 색·서체 규칙 (쪽빛과 감빛)

팔레트와 서체는 `src/const/common/Theme.ts` 한 곳에서 정한다. 컨셉은 '청출어람' — 옛말에서 나온 색을 요즘 채도로.

1. **브랜드(쪽빛) ≠ 정답(청포).** `primary*` 는 주요 액션·선택·활성에만 쓴다.
   정답·완료·승리 표시는 반드시 `success` / `successBg` / `successSoft` / `successBorder` / `successDark` / `successDeep`.
   (예전 그린 primary 시절 코드가 정답에 primary 를 썼다 — 새로 만들 때 따라 하지 말 것)
2. 서체는 두 벌이다.
   - `FONTS.body`(Pretendard) — 전역 기본값이라(`TextDefaults.ts`) 화면에서 지정하지 않는다.
   - `FONTS.display`(고운바탕, 'Gowun Batang') — **두 곳에만** 쓴다. 규칙은 "명조 = 속담" 하나로 읽혀야 한다.
     1) 속담 문장 — 어디에 어떤 모양(제목·목록·칩·태그·보기)으로 나오든 전부.
     2) 화면 타이틀(헤더·화면 최상단 헤드라인 하나)과 모달/다이얼로그/바텀시트 타이틀.
     섹션 제목, 카드 제목, 빈 화면 제목, 등급·뱃지·타워 이름, 마크다운 헤딩, 본문·뜻풀이·예문·버튼·숫자는 전부 본문 서체다.
     예외는 하나 — `InAppRemoveAdsSection` 의 프리미엄 카드(원래부터 명조 디자인).
   - 같은 자리에 모드에 따라 속담 또는 뜻이 오는 퀴즈 UI 는 속담이 올 때만 붙인다 (`QuizScreen` 의 `proverbFont` 참고).
   - 중첩 `<Text>` 는 부모 서체를 물려받는다(`TextDefaults` 가 중첩에는 기본값을 넣지 않는다).
     속담만 강조하려면 바깥이 아니라 속담 부분의 안쪽 `<Text>` 에 붙인다.
3. 서체 파일은 `android/app/src/main/res/font` 한 곳에만 둔다(iOS 는 같은 파일을 Xcode 에서 참조).
   추가·교체 시 XML 패밀리, `MainApplication` 등록, `Info.plist` UIAppFonts, Xcode 리소스를 함께 고친다 —
   `__tests__/fontAssets.test.ts` 가 넷의 일치를 확인한다. OFL 고지는 `scripts/genOpenSource.js` 의 `BUNDLED_FONTS`.
4. 고운바탕은 원본(굵기별 8MB)을 가공해서 넣었다. 원본으로 갈아끼우면 다시 해야 한다.
   - 한글은 완성형 2,350자 + `src` 데이터에 나오는 음절만 남기고 힌팅 제거(→ 1.4MB). 사용자가 입력한
     드문 음절은 시스템 서체로 그려진다. 속담 데이터를 늘리면 다시 서브셋한다.
   - 줄높이(hhea) 1.448em → 1.2em (시스템 서체와 같게). 안 하면 제목 박스가 커진다.
   - 한글 디스플레이 서체를 고를 때는 굵은 두께의 한글 모양을 직접 렌더해서 본다.
     처음 고른 Hahmlet 은 600/700 에서 한글이 고딕처럼 보여 본문과 구분되지 않았다.

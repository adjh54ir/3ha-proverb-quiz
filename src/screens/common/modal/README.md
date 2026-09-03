## 1. 모달 팝업 구성시 주의점

### 1. 텍스트 입력할 때 키보드 가림 증상 : KeyboardAvoidingView 는 `behavior="padding"` 으로 통일

```tsx
<Modal animationType="slide" transparent visible={visible} onRequestClose={close}>
  <KeyboardAvoidingView behavior="padding" style={[styles.overlay, safePadding]}>
    <View>
      <Text>Content 영역</Text>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

`Platform.OS === 'ios' ? 'padding' : 'height'` 를 쓰지 않는다. 이유는 세 가지다.

1. **안드로이드에서 `undefined` 는 회피가 아예 안 된다.**
   `MainActivity` 가 edge-to-edge(`WindowCompat.setDecorFitsSystemWindows(window, false)`)라
   매니페스트의 `windowSoftInputMode="adjustResize"` 로 창이 줄어들지 않는다.
   그래서 안드로이드도 `behavior` 를 반드시 줘야 한다.

2. **`'height'` 는 바텀시트에서 하단이 잘린다.**
   `'height'` 는 KeyboardAvoidingView 자신의 높이만 줄인다. 오버레이가
   `justifyContent: 'flex-end'` 인 시트는 아래쪽에 붙은 상태로 짧아지기만 해서
   시트 하단(확인 버튼)이 여전히 키보드에 덮인다.
   `'padding'` 은 아래쪽 여백으로 내용을 밀어올려 항상 보인다.

3. **이중으로 밀릴 걱정은 없다.**
   `KeyboardAvoidingView` 는 자기 프레임과 키보드가 **겹치는 만큼만** 계산한다
   (`_relativeKeyboardHeight`). 창이 이미 줄어든 기기나 탭 바가 있는 화면에서도
   겹침이 0 이면 아무 일도 하지 않는다.

### 2. 스크롤/빈 영역 탭으로 키보드 닫기 : 전역 기본값이라 화면에서 붙이지 않는다

`src/utils/ScrollDefaults.ts` 가 `ScrollView.defaultProps` 를 바꿔 앱 전체에 적용한다
(`FlatList` / `SectionList` / `Animated.ScrollView` 도 내부적으로 이 ScrollView 를 쓴다).

| 프롭 | 값 | 효과 |
| --- | --- | --- |
| `keyboardDismissMode` | `'on-drag'` | 스크롤을 움직이면 키보드가 닫힌다 |
| `keyboardShouldPersistTaps` | `'handled'` | 버튼 탭은 그대로 전달, 빈 영역 탭에서만 키보드가 닫힌다 |
| `automaticallyAdjustKeyboardInsets` | `true` (iOS) | 겹치는 만큼만 인셋 + 포커스된 입력창을 화면 안으로 끌어올린다 |

스크롤 영역이 없는 카드형 모달은 딤/카드 배경에 `Keyboard.dismiss` 를 붙인다.

```tsx
<Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
```

### 3. 모달 팝업 외의 영역을 눌렀을 때 팝업이 닫히는 방법

오버레이 전체를 `Pressable` 로 깔고 `onPress` 에 닫기 핸들러를 준다.
카드 안쪽 탭이 딤까지 전달되지 않도록 카드는 `Pressable` 밖(형제)에 둔다.

### 4. 레이아웃 규칙

`AppModal` 은 딤이 잘리지 않도록 `Dimensions.get('screen')` 크기로 깔린다.
오버레이에는 항상 `useModalSafePadding()` 을, 카드 폭에는 태블릿 상한
(`MODAL_MAX_WIDTH` / 시트는 `CONTENT_MAX_WIDTH`)을 준다. 자세한 규칙은
프로젝트 루트 `CLAUDE.md` 의 "모달 레이아웃 규칙" 참고.

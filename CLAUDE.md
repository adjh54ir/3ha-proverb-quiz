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

3. 세로 크기에 `scaleHeight(고정값)` 을 쓰지 않는다. `scaleHeight` 는 `값 × min(기기 높이 / 812, 1.3)`
   이라서 화면 높이에 비례한다(태블릿에서 과하게 커지지 않도록 `MAX_HEIGHT_SCALE = 1.3` 상한이 걸려 있다).
   즉 `scaleHeight(700)` 은 상수가 아니라 "화면 높이의 86%"(상한에 걸리기 전까지)이고, 큰 기기에서
   카드가 같이 커져 위아래가 잘린다. 세로는 퍼센트로, `scaleHeight` 는 아이콘·이미지 같은 작은 고정 요소에만.
   폭·폰트도 같은 방식으로 `MAX_WIDTH_SCALE = 1.4`, `MAX_FONT_SCALE = 1.25` 상한이 있다
   (`src/utils/DementionUtils.ts`).

4. 카드 높이를 직접 계산하는 모달(예: `TowerResultModal` 의 `height * 0.8`)은 오버레이 패딩이 먹지 않는다.
   그런 경우는 계산식에서 insets 를 빼야 한다.

5. 테스트에서 모달을 `SafeAreaProvider` 없이 렌더하면 `useSafeAreaInsets` 가 throw 한다.
   `jest.setup.js` 에 `react-native-safe-area-context/jest/mock` 이 등록돼 있으니 그대로 두면 된다.

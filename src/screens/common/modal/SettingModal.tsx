// 추가 모달 컴포넌트 두 개 생성
import React from 'react';
import ModalCloseButton from '@/screens/common/atomic/ModalCloseButton';
import { OPEN_SOURCE_LIBS } from '@/const/common/OpenSourceData';
import { Animated, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import useModalSafePadding from '@/hooks/useModalSafePadding';
import { useModalEnter } from '@/hooks/useModalEnter';
import { scaledSize, scaleHeight } from '@/utils/DementionUtils';
import Markdown from 'react-native-markdown-display';
import IconComponent from '../atomic/IconComponent';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles, themedValue, getThemeMode } from '@/const/common/Theme';

const markdown = `
# 1) 개인정보처리방침

본 개인정보처리방침은 모바일 기기용 **"속픽: 속담 퀴즈"** 애플리케이션(이하 "애플리케이션")에 적용되며, 해당 애플리케이션은 **EcodeLab**(이하 "서비스 제공자")에 의해 **무료 서비스**로 제작되었습니다. 본 서비스는 "있는 그대로(AS IS)" 제공됩니다.

---

## 1. 정보 수집 및 이용

애플리케이션은 사용자가 다운로드하고 사용할 때 정보를 수집할 수 있습니다. 수집될 수 있는 정보는 다음과 같습니다:

- 사용자의 기기 인터넷 프로토콜 주소(IP 주소 등)
- 애플리케이션 내 방문한 페이지, 방문 시간 및 날짜, 페이지 체류 시간
- 애플리케이션 사용 시간
- 사용 중인 모바일 기기의 운영체제 정보

※ 애플리케이션은 사용자의 **정확한 위치 정보는 수집하지 않습니다.**

서비스 제공자는 중요 공지, 필수 알림, 마케팅 홍보 등을 위해 수집된 정보를 활용할 수 있습니다.

더 나은 서비스 제공을 위해 개인 식별이 가능한 정보를 요청할 수 있으며, 해당 정보는 본 방침에 따라 저장 및 활용됩니다.

---

## 2. 제3자 접근

익명화된 집계 데이터만 주기적으로 외부 서비스에 전송되어 서비스 개선에 활용됩니다.

서비스 제공자는 다음과 같은 방식으로 제3자에게 정보를 공유할 수 있습니다:

- 법적 요구에 따라 (예: 소환장, 법원 명령 등)
- 사용자 및 타인의 권리·안전 보호, 사기 방지, 정부 요청 대응 등 정당한 사유가 있을 경우
- 본 방침을 준수하는 신뢰할 수 있는 서비스 제공자와의 공유 (독립적 사용 불가 조건)

### 🔗 사용된 제3자 서비스의 개인정보처리방침 링크:

- [Google Play Services](https://policies.google.com/privacy)
- [AdMob](https://support.google.com/admob/answer/6128543)

---

## 3. 옵트아웃 권리

언제든지 애플리케이션을 **삭제함으로써 정보 수집을 중단**할 수 있습니다.

이는 기기의 기본 삭제 기능 또는 앱 마켓을 통해 가능합니다.

---

## 4. 데이터 보관 정책

서비스 제공자는 사용자가 애플리케이션을 사용하는 동안과 그 이후 **합리적인 기간** 동안 사용자 제공 데이터를 보관합니다.

삭제를 요청하고자 할 경우 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com)으로 연락 주시면 합리적인 기간 내에 조치하겠습니다.

---

## 5. 아동의 개인정보

서비스 제공자는 **만 13세 미만 아동으로부터 고의로 개인정보를 수집하거나 마케팅하지 않습니다.**

만약 만 13세 미만의 아동이 개인정보를 제공한 것이 확인되면, 해당 정보를 **즉시 삭제**하겠습니다.

부모 또는 보호자께서는 자녀의 정보 제공 사실을 알게 된 경우, [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com) 으로 연락 주시기 바랍니다.

---

## 6. 보안

서비스 제공자는 사용자 정보의 기밀성을 보호하기 위해 **물리적, 전자적, 절차적 보안 수단**을 사용합니다.

---

## 7. 변경사항

본 개인정보처리방침은 향후 변경될 수 있으며, 변경 시 본 페이지에 갱신된 내용을 게시함으로써 고지합니다.

사용자는 정기적으로 본 방침을 확인해 주시기 바라며, **지속적인 이용은 변경 사항에 동의한 것으로 간주됩니다.**

> 본 방침은 2025년 5월 14일부터 적용됩니다.
> 

---

## 8. 동의

사용자는 본 애플리케이션을 이용함으로써 본 개인정보처리방침에 따라 정보가 수집 및 사용되는 것에 **동의**하게 됩니다.

---

## 9. 문의하기

서비스 이용 중 개인정보 관련 문의 사항이 있으실 경우 아래 이메일로 연락해 주세요.

📧 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com)

# 2) 이용약관

본 이용약관은 모바일 기기용 애플리케이션인 **"속픽: 속담 퀴즈"**(이하 "애플리케이션")에 적용되며, 본 애플리케이션은 **EcodeLab**(이하 "서비스 제공자")에 의해 **무료 서비스**로 제공됩니다.

---

## 1. 동의

애플리케이션을 다운로드하거나 사용하는 경우, 본 약관에 자동으로 동의하는 것으로 간주됩니다. 사용 전 반드시 본 약관을 충분히 읽고 이해하시기 바랍니다.

---

## 2. 금지 사항

다음과 같은 행위는 엄격히 금지됩니다:

- 애플리케이션 또는 그 일부의 무단 복사 및 수정
- 소스 코드 추출, 다른 언어로 번역, 파생 버전 제작 시도
- 서비스 제공자의 상표 및 저작권 등 지식재산권 침해

애플리케이션에 관련된 모든 권리는 서비스 제공자에게 귀속됩니다.

---

## 3. 서비스 변경 및 요금

서비스 제공자는 애플리케이션을 더 유익하고 효율적으로 제공하기 위해 **언제든지 기능을 수정하거나 유료화할 수 있는 권리**를 가집니다. 단, 유료 전환 시 사전에 명확하게 고지됩니다.

---

## 4. 개인정보 처리

서비스 제공자는 사용자로부터 제공받은 개인정보를 저장 및 처리하며, 서비스 제공 목적으로만 사용합니다.

사용자는 자신의 휴대폰 보안과 애플리케이션 접근 권한을 직접 책임져야 합니다.

**루팅 또는 탈옥된 기기**에서의 사용은 권장되지 않으며, 이는 보안 취약성 및 정상 작동 실패를 초래할 수 있습니다.

---

## 5. 제3자 서비스 약관

애플리케이션은 다음과 같은 제3자 서비스를 포함할 수 있으며, 이들 서비스에는 각자의 약관이 적용됩니다:

- [Google Play Services](https://policies.google.com/terms)
- [AdMob](https://www.google.com/admob/terms.html)

---

## 6. 인터넷 연결 책임

애플리케이션의 일부 기능은 **활성 인터넷 연결**이 필요하며, Wi-Fi 또는 이동통신망을 통해 연결됩니다.

인터넷 미연결 또는 데이터 소진으로 인한 기능 저하에 대해 서비스 제공자는 책임지지 않습니다.

---

## 7. 데이터 요금 및 이용자의 책임

Wi-Fi 외 환경에서 사용 시 발생하는 데이터 요금 및 로밍 요금 등은 **사용자 본인의 책임**입니다.

기기 소유자가 아닌 경우, 해당 기기의 요금 납부자에게 사용 허가를 받았음을 전제로 합니다.

또한, **기기의 배터리 상태**로 인해 서비스 사용이 불가능한 경우에도 서비스 제공자는 책임지지 않습니다.

---

## 8. 정보의 정확성 및 의존성

서비스 제공자는 애플리케이션이 항상 최신이고 정확하도록 노력하지만, 제3자로부터 제공받는 정보에 의존할 수 있습니다.

해당 정보에 전적으로 의존하여 발생하는 **직·간접적 손실**에 대해서는 책임을 지지 않습니다.

---

## 9. 애플리케이션 업데이트 및 종료

운영체제 요건이 변경될 수 있으며, 사용자는 계속 사용하기 위해 업데이트를 수락해야 합니다.

서비스 제공자는 사전 고지 없이 애플리케이션 제공을 중단하거나 종료할 수 있습니다. 종료 시:

- 본 약관에 따른 사용자 권리와 라이선스는 종료됩니다.
- 애플리케이션 사용을 중단하고, 필요한 경우 기기에서 삭제해야 합니다.

---

## 10. 약관 변경

서비스 제공자는 본 이용약관을 수시로 변경할 수 있으며, **변경 시 본 페이지에 게시함으로써 고지**됩니다.

정기적으로 본 페이지를 확인하시기 바랍니다.

> 본 이용약관은 2025년 5월 14일부터 효력이 발생합니다.
> 

---

## 11. 문의

이용약관에 대한 질문이나 제안사항이 있을 경우 아래 이메일로 문의해 주세요.

📧 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com)
`;



export const TermsOfServiceModal = ({ visible, onClose }) => {
  const enterStyle = useModalEnter(visible);
  const safePadding = useModalSafePadding();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[modalStyles.overlay, safePadding]}>
        <Animated.View style={[modalStyles.container, enterStyle]}>
          <View style={modalStyles.header}>
            <View style={modalStyles.spacer} />
            <Text style={modalStyles.modalTitle}>개인정보처리방침 및 이용약관</Text>
            <ModalCloseButton onPress={onClose} style={modalStyles.closeIcon} />
          </View>

          <ScrollView contentContainerStyle={modalStyles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={modalStyles.markdownBox}>
              {/* React.memo 컴포넌트라 style 프롭 동등성으로 렌더를 건너뛴다 → 모드를 key 로 걸어 갱신 */}
              <Markdown key={getThemeMode()} style={markdownStyles}>
                {markdown}
              </Markdown>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};


export const OpenSourceModal = ({ visible, onClose }) => {
  const enterStyle = useModalEnter(visible);
  const safePadding = useModalSafePadding();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[modalStyles.overlay, safePadding]}>
        <Animated.View style={[modalStyles.container, enterStyle]}>
          <View style={modalStyles.header}>
            <View style={modalStyles.spacer} />
            <Text style={modalStyles.modalTitle}>오픈소스 라이선스</Text>
            <ModalCloseButton onPress={onClose} style={modalStyles.closeIcon} />
          </View>

          <ScrollView contentContainerStyle={modalStyles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.wrapperBox}>
              {OPEN_SOURCE_LIBS.map((lib, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <IconComponent
                      type="Feather"
                      name="package"
                      size={scaledSize(16)}
                      color={COLORS.textStrong}
                      style={styles.icon}
                    />
                    <Text style={styles.libName}>{lib.name}</Text>
                  </View>
                  <Text style={styles.license}>
                    License: {lib.license} | Version: {lib.version}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(lib.url)}
                    style={styles.linkWrapper}
                    activeOpacity={0.8}
                    hitSlop={HIT_SLOP}
                  >
                    <IconComponent
                      type="Feather"
                      name="external-link"
                      size={scaledSize(14)}
                      color={COLORS.secondaryDark}
                    />
                    <Text style={styles.linkText}>GitHub 보기</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.footer}>
                🙏 오픈소스 커뮤니티에 감사드립니다.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
const modalStyles = themedStyles(() => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.dim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING_W.lg,
  },
  container: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING_H.lg,
    paddingHorizontal: SPACING_W.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING_H.lg,
  },
  markdownBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING_W.lg,
    paddingVertical: SPACING_H.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scaleHeight(44),
    marginBottom: SPACING_H.md,
  },
  modalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.textStrong,
  },
  spacer: {
    width: scaledSize(22) + SPACING_W.sm, // 닫기 아이콘 크기 + 여백만큼 확보
  },
  closeIcon: {
    // 공용 ModalCloseButton 은 카드 우상단 고정이 기본이라, 헤더 행 안에 넣을 때는 흐름 배치로 되돌린다.
    position: 'relative',
    top: 0,
    right: 0,
  },
}));
const styles = themedStyles(() => StyleSheet.create({
  wrapperBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING_W.lg,
    paddingVertical: SPACING_H.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING_W.md,
    paddingVertical: SPACING_H.md,
    marginBottom: SPACING_H.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING_H.xs,
  },
  icon: {
    marginRight: SPACING_W.sm,
  },
  libName: {
    fontSize: FONT_SIZES.mdPlus,
    fontWeight: '600',
    color: COLORS.textStrong,
  },
  license: {
    fontSize: FONT_SIZES.smPlus,
    color: COLORS.textSecondary,
    marginBottom: SPACING_H.sm,
  },
  linkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: FONT_SIZES.smPlus,
    fontWeight: '500',
    color: COLORS.secondaryDark,
    marginLeft: SPACING_W.xs,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: SPACING_H.lg,
    fontSize: FONT_SIZES.smPlus,
    color: COLORS.textLight,
    textAlign: 'center',
  },
}));

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const markdownStyles = themedValue(() => ({
  body: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: scaledSize(24),
  },
  heading1: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '700',
    color: COLORS.textStrong,
    marginBottom: SPACING_H.lg,
  },
  heading2: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textStrong,
    marginTop: SPACING_H.xxl,
    marginBottom: SPACING_H.md,
  },
  heading3: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textStrong,
    marginTop: SPACING_H.xl,
    marginBottom: SPACING_H.sm,
  },
  bullet_list: {
    marginBottom: SPACING_H.lg,
  },
  blockquote: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING_W.md,
    paddingVertical: SPACING_H.sm,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.secondary,
  },
}));

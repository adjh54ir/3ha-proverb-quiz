// screens/TermsScreen.tsx
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';

const markdown = `

# **1) 개인정보 처리방침**

본 개인정보 처리방침은 EcodeLab(이하 "서비스 제공자")이 광고 지원(Ad Supported) 서비스로 제작한 모바일 애플리케이션 **속픽: 속담 퀴즈**(이하 "애플리케이션")에 적용됩니다. 본 서비스는 "있는 그대로(AS IS)" 제공됩니다.

---

## **1. 정보 수집 및 이용**

애플리케이션은 사용자가 다운로드하고 이용할 때 다음과 같은 정보를 수집할 수 있습니다:

- 기기의 인터넷 프로토콜 주소(IP 주소)
- 애플리케이션 내 방문한 페이지, 방문 일시, 해당 페이지에서 머문 시간
- 애플리케이션 사용 시간
- 기기의 운영체제 정보

애플리케이션은 사용자의 **정확한 위치 정보**를 수집하지 않습니다.

단, 애플리케이션은 기기의 **대략적인 위치 정보**를 수집하며, 이는 다음과 같이 활용됩니다:

- **위치 기반 서비스**: 맞춤형 콘텐츠, 관련 추천, 위치 기반 기능 제공
- **분석 및 개선**: 익명화된 위치 데이터로 사용자 행동 분석, 트렌드 파악, 기능 및 성능 개선
- **제3자 서비스 활용**: 주기적으로 익명화된 위치 데이터를 외부 서비스에 전송하여 애플리케이션 최적화 및 기능 향상에 활용

또한, 서비스 제공자는 필요에 따라 중요 알림, 필수 고지, 마케팅 프로모션 등을 위해 사용자가 제공한 정보를 이용할 수 있습니다.

더 나은 사용자 경험을 위해 서비스 제공자는 일부 개인 식별 정보를 요청할 수 있으며, 이 정보는 본 정책에 따라 보관 및 활용됩니다.

---

## **2. 제3자 접근**

서비스 제공자는 익명화된 집계 데이터만을 외부 서비스에 주기적으로 전송하여 애플리케이션 및 서비스 개선에 활용합니다.

애플리케이션은 제3자 서비스를 사용하며, 각 서비스의 개인정보 처리방침은 아래에서 확인할 수 있습니다:

- [Google Play Services](https://www.google.com/policies/privacy/)
- [AdMob](https://support.google.com/admob/answer/6128543?hl=ko)
- [Google Analytics for Firebase](https://firebase.google.com/support/privacy)
- [Firebase Crashlytics](https://firebase.google.com/support/privacy)

서비스 제공자는 다음과 같은 경우 사용자 정보를 제공할 수 있습니다:

- 법률에 따른 요구(예: 소환장, 법적 절차 등)
- 권리 보호, 사용자 및 타인의 안전 보호, 사기 조사, 정부 요청 대응 필요 시
- 서비스 제공자를 대신하여 업무를 수행하며, 독립적 정보 사용이 불가하고 본 방침을 준수하는 신뢰할 수 있는 제휴사에 제공될 때

---

## **3. 옵트아웃 권리**

사용자는 애플리케이션을 삭제(언인스톨)함으로써 모든 정보 수집을 중단할 수 있습니다.

이는 기기의 표준 삭제 기능 또는 앱 마켓을 통해 가능합니다.

---

## **4. 데이터 보관 정책**

서비스 제공자는 사용자가 애플리케이션을 이용하는 동안 및 합리적인 기간 동안 사용자 제공 데이터를 보관합니다.

제공한 데이터의 삭제를 원할 경우 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com) 으로 연락하면 합리적인 기간 내에 조치가 이루어집니다.

---

## **5. 아동 개인정보 보호**

서비스 제공자는 만 13세 미만 아동으로부터 개인정보를 의도적으로 수집하거나 마케팅하지 않습니다.

만약 13세 미만 아동이 개인정보를 제공한 사실을 알게 될 경우 즉시 삭제하며, 부모나 보호자가 이를 알게 된 경우 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com) 으로 연락하여 필요한 조치를 요청할 수 있습니다.

---

## **6. 보안**

서비스 제공자는 정보의 기밀성을 보호하기 위해 물리적, 전자적, 절차적 보호 조치를 마련하고 있습니다.

---

## **7. 변경사항**

본 개인정보 처리방침은 필요에 따라 갱신될 수 있으며, 변경 시 본 페이지에 게시됩니다.

애플리케이션을 계속 사용하는 경우 변경사항에 동의한 것으로 간주됩니다.

본 방침은 **2025-05-14**부터 유효합니다.

---

## **8. 동의**

애플리케이션을 사용함으로써, 사용자는 본 개인정보 처리방침에 따라 정보가 처리되는 것에 동의하게 됩니다.

---

## **9. 문의하기**

개인정보 처리방침과 관련된 문의사항은 아래 이메일로 연락해주시기 바랍니다.

📧 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com)

---

# **2) 이용약관**

본 이용약관은 EcodeLab(이하 "서비스 제공자")이 광고 지원(Ad Supported) 서비스로 제작한 모바일 애플리케이션 **속픽: 속담 퀴즈**(이하 "애플리케이션")에 적용됩니다.

---

## **1. 동의 및 제한 사항**

애플리케이션을 다운로드하거나 이용하는 경우, 사용자는 자동으로 본 약관에 동의하게 됩니다.

애플리케이션 사용 전 반드시 본 약관을 숙지하시기 바랍니다.

다음 행위는 엄격히 금지됩니다:

- 애플리케이션 또는 그 일부의 무단 복사 및 수정
- 애플리케이션의 소스 코드 추출 시도
- 애플리케이션의 타 언어 번역, 파생 버전 제작
- 서비스 제공자의 상표권, 저작권, 데이터베이스 권리, 기타 지식재산권 침해

모든 지식재산권은 서비스 제공자에게 귀속됩니다.

---

## **2. 서비스 제공자의 권리**

서비스 제공자는 애플리케이션을 최대한 유용하고 효율적으로 유지하기 위해 언제든지 애플리케이션을 수정하거나 서비스에 요금을 부과할 권리를 보유합니다.

단, 요금 부과 시 사전에 명확히 안내합니다.

애플리케이션은 사용자가 제공한 개인정보를 처리·저장하며, 사용자는 본인의 기기와 애플리케이션 접근에 대한 보안을 유지할 책임이 있습니다.

특히, 기기의 운영체제 제한을 해제하는 **루팅(rooting)** 또는 **탈옥(jailbreaking)** 은 권장하지 않습니다. 이는 악성코드, 바이러스 감염, 보안 기능 훼손, 애플리케이션 오류 발생 등의 위험을 초래할 수 있습니다.

---

## **3. 제3자 서비스**

애플리케이션은 제3자 서비스의 약관을 따릅니다. 아래는 해당 서비스의 약관 링크입니다:

- [Google Play Services](https://policies.google.com/terms)
- [AdMob](https://developers.google.com/admob/terms)
- [Google Analytics for Firebase](https://www.google.com/analytics/terms/)
- [Firebase Crashlytics](https://firebase.google.com/terms/crashlytics)

---

## **4. 인터넷 연결 및 요금**

일부 기능은 인터넷 연결(Wi-Fi 또는 이동통신망)이 필요합니다. 인터넷 연결 불가, 데이터 소진 등으로 인한 애플리케이션 기능 제한에 대해 서비스 제공자는 책임을 지지 않습니다.

Wi-Fi가 아닌 환경에서 사용할 경우, 사용자의 이동통신사 요금제에 따른 데이터 요금이 발생할 수 있으며, 해외 사용 시 로밍 요금이 부과될 수 있습니다.

해당 요금은 전적으로 사용자의 책임이며, 기기 명의자가 아닌 경우 반드시 요금 납부자의 동의를 얻어야 합니다.

---

## **5. 기기 관리 책임**

사용자는 기기가 충전된 상태를 유지할 책임이 있으며, 배터리 방전으로 인해 애플리케이션을 사용하지 못하는 경우 서비스 제공자는 책임지지 않습니다.

---

## **6. 책임의 한계**

서비스 제공자는 항상 최신 정보 제공을 위해 노력하나, 제3자로부터 제공받은 정보에 의존하는 경우가 있습니다.

따라서 애플리케이션 기능만을 전적으로 신뢰하여 발생한 직접적·간접적 손실에 대해 책임을 지지 않습니다.

---

## **7. 업데이트 및 서비스 종료**

애플리케이션은 운영체제(OS) 정책 변경에 따라 업데이트가 필요할 수 있으며, 사용자는 제공되는 업데이트를 수락해야 합니다.

서비스 제공자는 언제든 애플리케이션 제공을 중단할 수 있으며, 종료 시점부터 사용자는 애플리케이션 사용 권한을 잃으며 기기에서 삭제해야 합니다.

---

## **8. 이용약관 변경**

서비스 제공자는 필요에 따라 본 약관을 갱신할 수 있습니다. 변경 시 본 페이지에 게시되며, 사용자가 계속 애플리케이션을 이용하는 경우 변경사항에 동의한 것으로 간주됩니다.

본 약관은 **2025-05-14**부터 유효합니다.

---

## **9. 문의하기**

이용약관 관련 문의사항이나 제안사항은 아래 이메일로 연락해주시기 바랍니다.

📧 [**adjh54ir@gmail.com**](mailto:adjh54ir@gmail.com)
`;

const TermsScreen = () => {
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={styles.markdownBox}>
					<Markdown style={markdownStyles}>{markdown}</Markdown>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default TermsScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	scrollContainer: {
		paddingVertical: scaleHeight(24),
		paddingHorizontal: scaleWidth(20),
	},
	markdownBox: {
		backgroundColor: '#f4f5f7',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#e0e0e0',
		padding: scaleWidth(16),
	},
});

const markdownStyles = {
	body: {
		color: '#2c3e50',
		fontSize: scaledSize(14),
		lineHeight: scaleHeight(24),
	},
	heading1: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		marginBottom: scaleHeight(16),
	},
	heading2: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginTop: scaleHeight(24),
		marginBottom: scaleHeight(12),
	},
	heading3: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(8),
	},
	bullet_list: {
		marginBottom: scaleHeight(16),
	},
	blockquote: {
		backgroundColor: '#f8f9fa',
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(8),
		color: '#7f8c8d',
	},
	link: {
		color: '#3498db',
	},
};

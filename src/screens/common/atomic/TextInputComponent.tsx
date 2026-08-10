import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { scaleHeight } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W } from '@/const/common/Theme';

/**
 * TextInput 줄넘김 증상에 대한 해결
 */
const TextInputComponent = () => {
	const textRef = useRef<Text>(null);
	const textInputRef = useRef<TextInput>(null);

	const [formData, setFormData] = useState({
		text: '',
		name: '',
	});

	return (
		<View>
			<View style={styles.formGroup}>
				<Text style={styles.label}>텍스트 라벨</Text>
				{/* TextInput 활용예시 */}
				<TextInput
					ref={textInputRef}
					style={styles.textInput}
					multiline={true}
					onChangeText={(text) => {
						setFormData({
							...formData,
							name: text,
						});
					}}
					placeholder="텍스트를 입력해주세요"
					placeholderTextColor={COLORS.textLight}
				/>
				{/* Text 활용예시 */}
				<Text ref={textRef} style={styles.text} numberOfLines={1} ellipsizeMode="tail" />
			</View>
		</View>
	);
};
export default TextInputComponent;

const styles = StyleSheet.create({
	formGroup: {
		marginBottom: SPACING_H.lg,
		position: 'relative',
	},
	label: {
		fontSize: FONT_SIZES.lg,
		marginBottom: SPACING_H.sm,
		fontWeight: '500',
		color: COLORS.text,
	},
	text: {
		color: COLORS.secondary,
		fontWeight: '600',
		fontSize: FONT_SIZES.md,
		flexShrink: 1, // 텍스트가 너무 길 경우 축소 허용
		marginLeft: SPACING_W.xs,
		maxWidth: '90%',
	},
	textInput: {
		height: scaleHeight(100),
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.sm,
		padding: SPACING_W.md,
		fontSize: FONT_SIZES.md,
		marginBottom: SPACING_H.lg,
		color: COLORS.text,
		textAlignVertical: 'top',
	},
});

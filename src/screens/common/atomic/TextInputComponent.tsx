import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
					placeholder='텍스트를 입력해주세요'
					placeholderTextColor='#666'
				/>
				{/* Text 활용예시 */}
				<Text ref={textRef} style={styles.text} numberOfLines={1} ellipsizeMode='tail'></Text>
			</View>
		</View>
	);
};
export default TextInputComponent;

const styles = StyleSheet.create({
	formGroup: {
		marginBottom: 16,
		position: 'relative',
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
		fontWeight: '500',
	},
	text: {
		color: '#007AFF',
		fontWeight: '600',
		fontSize: 14,
		flexShrink: 1, // 텍스트가 너무 길 경우 축소 허용
		marginLeft: 5,
		maxWidth: '90%',
	},
	textInput: {
		height: 100,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 14,
		marginBottom: 16,
		textAlignVertical: 'top',
	},
});

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

/**
 * 활용예시 
 * import LoadingComponent from './LoadingComponent';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View>
      {isLoading ? (
        <LoadingComponent loadingText="데이터를 불러오는 중..." />
      ) : (
        // 실제 컨텐츠
      )}
    </View>
  );
};
 */

interface LoadingComponentProps {
	loadingText?: string;
}

/**
 * 로딩 컴포넌트
 * @param loadingText 로딩 중 표시할 텍스트
 * @returns
 */
const LoadingComponent: React.FC<LoadingComponentProps> = ({ loadingText = '데이터를 불러오는 중...' }) => {
	return (
		<View style={styles.loadingContainer}>
			<ActivityIndicator size='large' color='#007AFF' />
			<Text style={styles.loadingText}>{loadingText}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#333333',
	},
});

export default LoadingComponent;

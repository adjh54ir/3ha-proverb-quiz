import { createStackNavigator } from "@react-navigation/stack";

import { Paths } from "@/navigation/conf/Paths";
import Example from "@/screens/Example";
import SettingScreen from "@/screens/SettingScreen";
import Home from "@/screens/Home";

/**
 * Stack Navigator : 일반적인 화면만 출력을 하는 경우
 * @returns
 */
const StackNavigator = () => {
  const Stack = createStackNavigator(); // Stack Navigator 이름을 정의합니다.

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={Paths.HOME}
      detachInactiveScreens={true}
    >
      <Stack.Screen name={Paths.HOME} component={Home} />
      <Stack.Screen name={Paths.SETTING} component={SettingScreen} />
    </Stack.Navigator>
  );
};
export default StackNavigator;

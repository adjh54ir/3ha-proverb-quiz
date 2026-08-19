import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Paths } from "./conf/Paths";
import Home from "@/screens/Home";
import { COLORS } from "@/const/common/Theme";

const TopTab = createMaterialTopTabNavigator();
const TopNavigator = () => {
  return (
    <TopTab.Navigator
      initialRouteName={Paths.HOME}
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        swipeEnabled: true, // 스와이프 활성화
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
      }}
    >
      <TopTab.Screen
        name={Paths.HOME}
        component={Home}
        options={{
          title: "홈",
          tabBarLabel: "홈",
        }}
      />
    </TopTab.Navigator>
  );
};
export default TopNavigator;

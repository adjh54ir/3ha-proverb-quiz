import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Paths } from "./conf/Paths";
import Home from "@/screens/Home";

const TopTab = createMaterialTopTabNavigator();
const TopNavigator = () => {
  return (
    <TopTab.Navigator
      initialRouteName={Paths.HOME}
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
        swipeEnabled: true, // 스와이프 활성화
        tabBarStyle: {
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
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

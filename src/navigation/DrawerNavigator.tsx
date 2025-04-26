import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Home from "@/screens/Home";
import { Paths } from "./conf/Paths";
import DrawerContentScreen from "./screens/DrawerContentScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import IconComponent from "@/screens/common/atomic/IconComponent";

/**
 * Drawer Navigator : 왼쪽/오른쪽 Aside 메뉴를 구성합니다.
 * @returns
 */
const DrawerNavigator = () => {
  const Drawer = createDrawerNavigator();
  /**
   *
   */
  useEffect(() => {
    console.log("[+] DrawerNavigator");
  }, []);

  // 새로고침 버튼 컴포넌트
  const RefreshButton = ({ navigation, routeName }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: routeName }],
          });
        }}
        style={{ marginRight: 15 }}
      >
        <IconComponent type="materialIcons" name="refresh" size={24} color="#000" />
      </TouchableOpacity>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName={Paths.HOME}
      backBehavior="history"
      drawerContent={(props: any) => <DrawerContentScreen {...props} />}
      screenOptions={{
        drawerPosition: "left",
      }}
    >
      {/* 메인 화면 */}
      <Drawer.Screen
        name={Paths.HOME}
        component={Home}
        options={({ navigation }) => ({
          title: "홈",
          drawerLabel: "홈",
          headerRight: () => (
            <RefreshButton navigation={navigation} routeName={Paths.HOME} />
          ),
        })}
      />
    </Drawer.Navigator>
  );
};
export default DrawerNavigator;

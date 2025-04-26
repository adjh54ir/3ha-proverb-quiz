import type { StackScreenProps } from "@react-navigation/stack";
import { Paths } from "./Paths";

export type RootStackParamList = {
  [Paths.HOME]: undefined;
  [Paths.EXAMPLE]: undefined;
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

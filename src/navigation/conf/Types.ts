import type { StackScreenProps } from "@react-navigation/stack";
import { Paths } from "./Paths";

export type RootStackParamList = {
  [Paths.HOME]: undefined;
  [Paths.EXAMPLE]: undefined;
  [Paths.FAVORITE]: undefined;
  [Paths.MY_PROVERB_BOOK]: undefined;
  [Paths.MY_PROVERB_BOOK_DETAIL]: { bookId: string };
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

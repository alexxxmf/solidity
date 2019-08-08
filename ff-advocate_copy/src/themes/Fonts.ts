import { TextStyle } from "react-native";

export const size = {
  sectionHeaderLarge: 28,
  sectionHeaderMedium: 24,
  sectionHeaderSmall: 20,
  large: 20,
  medium: 18,
  small: 16,
  tiny: 14
};

export const family = {
  name: "Raleway"
};

export const style: {
  [key: string]: TextStyle;
} = {
  sectionHeaderLarge: {
    fontFamily: family.name,
    fontSize: size.sectionHeaderMedium,
    fontWeight: "bold"
  },
  sectionHeaderSmall: {
    fontFamily: family.name,
    fontSize: size.sectionHeaderSmall
  },
  normal: {
    fontFamily: family.name,
    fontSize: size.medium
  },
  listSubtitle: {
    fontFamily: family.name,
    fontSize: size.tiny,
    fontWeight: "bold"
  },
  description: {
    fontFamily: family.name,
    fontSize: size.small
  },
  navigationTabs: {
    fontFamily: family.name,
    fontWeight: "bold",
    fontSize: size.tiny
  },
  buttons: {
    fontFamily: family.name,
    fontWeight: "bold",
    fontSize: size.small
  }
};

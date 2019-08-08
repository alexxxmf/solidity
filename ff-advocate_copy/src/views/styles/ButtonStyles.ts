import { StyleSheet } from "react-native";
import { Fonts, Metrics, Colors } from "../../themes";

export default StyleSheet.create({
  base: {
    borderRadius: Metrics.buttonRadiusDouble,
    borderWidth: Metrics.buttonBorder,
    paddingVertical: Metrics.marginVertical
  },
  solid: {
    backgroundColor: Colors.black,
    borderColor: Colors.black
  },
  solidRed: {
    backgroundColor: Colors.error,
    borderColor: Colors.error
  },
  solidTitle: {
    ...Fonts.style.buttons
  },
  outline: {
    backgroundColor: Colors.white,
    borderColor: Colors.black
  },
  outlineTitle: {
    ...Fonts.style.buttons,
    color: Colors.black
  },
  disabled: {
    opacity: 0.48
  }
});

import { StyleSheet } from "react-native";
import { Fonts, Metrics, Colors } from "../../themes";

export default StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background
  },
  sectionContainer: {
    paddingHorizontal: Metrics.baseMargin
  },
  sectionTitle: {
    ...Fonts.style.sectionHeaderLarge,
    color: Colors.black,
    textTransform: "capitalize",
    marginVertical: Metrics.baseMargin
  },
  sectionSubTitle: {
    ...Fonts.style.sectionHeaderSmall
  },
  sectionDescription: {
    ...Fonts.style.description,
    color: Colors.grayDark
  },
  sectionTitleIcon: {
    height: Metrics.images.large,
    width: Metrics.images.large,
    marginHorizontal: Metrics.baseMargin
  },
  imageBackground: {
    width: "100%",
    height: "100%"
  }
});

import { StyleSheet } from "react-native";
import { Fonts, Metrics, Colors } from "../../themes";

export default StyleSheet.create({
  sectionListItem: {
    backgroundColor: Colors.white,
    borderRadius: Metrics.buttonRadiusDouble,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: Metrics.baseMargin,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1
  },
  nextIcon: {
    color: Colors.textGray,
    fontSize: Fonts.size.large,
    fontWeight: "bold"
  },
  sectionListText: {
    color: Colors.textDark,
    fontFamily: Fonts.family.name,
    fontSize: Fonts.size.large,
    marginVertical: Metrics.baseMargin
  },
  noteListItem: {
    marginTop: Metrics.doubleBaseMargin
  }
});

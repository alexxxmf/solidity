import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Fonts, Metrics } from "../../../themes";
import ApplicationStyles from "../../styles/ApplicationStyles";

const AttributesIntro = () => (
  <View style={styles.titleContainer}>
    <Text style={styles.titleText}>Future Workforce Model</Text>
    <Text style={[ApplicationStyles.sectionDescription, styles.description]}>
      Understand what employers want, what citizens need and bridge any gaps
      between the two.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  titleContainer: {
    padding: Metrics.basePadding,
    marginVertical: Metrics.baseMargin
  },
  titleText: {
    ...Fonts.style.sectionHeaderSmall,
    fontWeight: "bold",
    color: Colors.black
  },
  description: {
    marginTop: Metrics.baseMargin,
    color: Colors.grayDark
  }
});

export default AttributesIntro;

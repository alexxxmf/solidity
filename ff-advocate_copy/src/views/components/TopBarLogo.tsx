import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { Colors, Fonts, Metrics } from "../../themes";

interface Props {
  brandingTitle: string;
}

const TopBarLogo = ({ brandingTitle }: Props) => (
  <Text style={styles.brandText}>{brandingTitle}</Text>
);
export default TopBarLogo;

const styles = StyleSheet.create({
  brandText: {
    ...Fonts.style.normal,
    color: Colors.white,
    fontWeight: "bold",
    ...Platform.select({
      android: {
        marginLeft: Metrics.baseMargin
      }
    })
  }
});

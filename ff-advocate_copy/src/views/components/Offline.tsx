import React from "react";
import { Text, View, StyleSheet, Image } from "react-native";
import { Colors, Images, Metrics } from "../../themes";
import ApplicationStyles from "../styles/ApplicationStyles";

const Offline = () => (
  <View style={styles.loadingWrapper}>
    <Image source={Images.network} style={styles.networkImage} />

    <Text style={ApplicationStyles.sectionSubTitle}>Oh dear!</Text>
    <Text style={ApplicationStyles.sectionDescription}>
      Looks like you have a connection issue.
    </Text>
    <Text style={ApplicationStyles.sectionDescription}>
      Check your internet and try again.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background
  },
  networkImage: {
    height: Metrics.images.xxlarge,
    width: Metrics.images.xxlarge
  }
});

export default Offline;

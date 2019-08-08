import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Colors, Fonts, Metrics } from "../../themes";
import LottieView from "lottie-react-native";

function Loader() {
  return (
    <View style={styles.loadingWrapper}>
      <LottieView
        style={styles.loadingSection}
        source={require("./LoaderAnimation.json")}
        autoPlay
        loop
      />
      <Text style={styles.loadingText}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background
  },
  loadingSection: {
    width: 200
  },
  loadingText: {
    ...Fonts.style.sectionHeaderSmall,
    marginVertical: Metrics.baseMargin,
    color: Colors.black
  }
});

export default Loader;

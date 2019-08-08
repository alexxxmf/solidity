import React, { Component } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../../../themes";
import AnalyticsContext from "../../AnalyticsContext";
import { onTestBuildNumber } from "../../AnalyticsProvider";

class BuildNumber extends Component {
  render() {
    return (
      <AnalyticsContext.Consumer>
        {context =>
          context && (
            <TouchableOpacity
              onPress={() => {
                onTestBuildNumber(context);
              }}
            >
              <Text style={styles.textVersion}>
                {`Version ${context.state.appReadableVersion || ""}`}
              </Text>
            </TouchableOpacity>
          )
        }
      </AnalyticsContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  textVersion: {
    textAlign: "center",
    color: Colors.grayDark
  }
});

export default BuildNumber;

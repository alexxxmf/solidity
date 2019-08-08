import React, { Component } from "react";
import { View, StatusBar, StyleSheet, Text } from "react-native";
import AppNavigation, { persistenceKey } from "../navigation/AppNavigation";
import { Colors, Fonts, Metrics } from "../themes";
import { AnalyticsContextValue } from "./AnalyticsContext";
import { AppScreenProps } from "../types";

interface Props {
  screenProps: AppScreenProps;
  onLoaded: () => Promise<void>;
  context: AnalyticsContextValue;
}

interface State {
  showVersionWarning: boolean;
}

class RootContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showVersionWarning: false
    };
  }

  async componentDidMount() {
    await this.props.onLoaded();
  }

  render() {
    return (
      <View style={styles.applicationView}>
        <StatusBar barStyle="light-content" />
        {this.props.context.acceptedVersion ? (
          <AppNavigation
            screenProps={this.props.screenProps}
            persistenceKey={persistenceKey}
          />
        ) : (
          <View style={styles.versionMessageWrapper}>
            <Text style={styles.versionMessage}>
              Sorry, your current version is not accepted. Please update your
              application and try again.
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  applicationView: {
    flex: 1
  },
  versionMessageWrapper: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.primary,
    justifyContent: "center",
    paddingHorizontal: Metrics.doublePadding
  },
  versionMessage: {
    color: Colors.warning,
    fontSize: Fonts.size.medium
  }
});

export default RootContainer;

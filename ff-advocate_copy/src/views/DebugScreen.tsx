import React, { Component } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AnalyticsDebugContext from "./AnalyticsDebugContext";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import Metrics from "../themes/Metrics";
import ApplicationStyles from "./styles/ApplicationStyles";
import Colors from "../themes/Colors";
import { AppScreenProps } from "../types";

type Props = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<{ session: string; uri: string }>;

class DebugScreen extends Component<Props> {
  render() {
    return (
      <AnalyticsDebugContext.Consumer>
        {context =>
          context && (
            <ScrollView
              style={[
                ApplicationStyles.sectionContainer,
                styles.sectionContainer
              ]}
            >
              {context.data.map((activity, i) => (
                <View style={styles.card} key={i}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text>UserData: {JSON.stringify(activity.user)}</Text>
                      <Text>DeviceData: {JSON.stringify(activity.device)}</Text>
                      <Text>
                        ActivityData: {JSON.stringify(activity.activity)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )
        }
      </AnalyticsDebugContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: Metrics.baseMargin,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    marginBottom: Metrics.baseMargin
  },
  cardHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionContainer: {
    flex: 1
  }
});

export default withNavigation(DebugScreen);

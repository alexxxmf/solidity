import React, { Component } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import {
  NavigationInjectedProps,
  NavigationParams,
  withNavigation
} from "react-navigation";
import { Metrics, Fonts, Images } from "../themes";
import ApplicationStyles from "./styles/ApplicationStyles";
import Button from "./components/Button";

type Props = NavigationInjectedProps<NavigationParams>;

class FeedbackThankYouScreen extends Component<Props> {
  render() {
    return (
      <View style={ApplicationStyles.mainContainer}>
        <View style={styles.contentContainer}>
          <View>
            <Text
              style={[ApplicationStyles.sectionSubTitle, styles.thankYouText]}
            >
              Thank you for your feedback. Time to celebrate!
            </Text>
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Back to deliver session"
              onPress={() => this.props.navigation.navigate("DeliverSessions")}
              type="outline"
            />
          </View>
          <View style={styles.imageWrapper}>
            <Image
              source={Images.thankyouCake}
              style={styles.cakeImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    );
  }
}

export default withNavigation(FeedbackThankYouScreen);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  thankYouText: {
    lineHeight: Fonts.size.sectionHeaderLarge,
    marginVertical: Metrics.doubleSection,
    textAlign: "center"
  },
  buttonWrapper: {
    flex: 2,
    alignItems: "center"
  },
  imageWrapper: {
    flex: 6
  },
  cakeImage: {
    width: 0.95 * Metrics.screenWidth,
    height: 0.95 * Metrics.screenWidth,
    marginBottom: Metrics.doubleBaseMargin
  }
});

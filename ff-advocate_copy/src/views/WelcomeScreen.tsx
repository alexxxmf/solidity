import React, { Component } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform
} from "react-native";
import Button from "./components/Button";
import ApplicationStyles from "./styles/ApplicationStyles";
import { Metrics, Images } from "../themes";
import { AppScreenProps } from "../types";
import { NavigationInjectedProps, withNavigation } from "react-navigation";

type Props = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<{}>;

class WelcomeScreen extends Component<Props> {
  render() {
    const { userName } = this.props.screenProps;

    return (
      <View style={ApplicationStyles.mainContainer}>
        {Platform.OS === "ios" ? <StatusBar barStyle="dark-content" /> : null}
        <View
          style={[ApplicationStyles.sectionContainer, styles.welcomeSection]}
        >
          <Text style={[ApplicationStyles.sectionSubTitle, styles.sectionText]}>
            Hello {userName}
          </Text>
          <Text style={[ApplicationStyles.sectionSubTitle, styles.sectionText]}>
            What do you want to do today?
          </Text>
        </View>
        <ImageBackground
          source={Images.idea}
          imageStyle={{ resizeMode: "cover" }}
          style={styles.callToAction}
        >
          <View>
            <Image
              source={Images.prepare}
              style={{
                height: Metrics.images.xxlarge,
                width: Metrics.images.xxlarge
              }}
              resizeMode="contain"
            />
            <Button
              title="Prepare"
              type="outline"
              onPress={() => {
                this.props.navigation.navigate("PrepareSessions");
              }}
            />
          </View>
          <View>
            <Image
              source={Images.deliver}
              style={{
                height: Metrics.images.xxlarge,
                width: Metrics.images.xxlarge
              }}
              resizeMode="contain"
            />
            <Button
              title="Deliver"
              type="outline"
              onPress={() => {
                this.props.navigation.navigate("DeliverSessions");
              }}
            />
          </View>
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  welcomeSection: {
    paddingTop: Metrics.doubleSection
  },
  sectionText: {
    textAlign: "center"
  },
  callToAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Metrics.section,
    paddingBottom: Metrics.screenHeight / 4,
    flex: 1
  }
});

export default withNavigation<Props>(WelcomeScreen);

import React, { Component } from "react";
import { View, Text, StyleSheet, Image, ImageBackground } from "react-native";
import { Images } from "../themes";
import ApplicationStyles from "./styles/ApplicationStyles";

import TopicsList from "./components/TopicsList";
import { CompletedProfileAppScreenProps } from "../types";

interface Props {
  screenProps: CompletedProfileAppScreenProps;
  advocateMode: "Prepare" | "Deliver";
}

class SessionsScreen extends Component<Props> {
  render() {
    const { screenProps, advocateMode } = this.props;

    return (
      <View style={ApplicationStyles.mainContainer}>
        <ImageBackground
          source={
            advocateMode === "Prepare" ? Images.prepareBg : Images.deliverBg
          }
          style={ApplicationStyles.imageBackground}
        >
          <View
            style={[ApplicationStyles.sectionContainer, styles.titleContainer]}
          >
            <Image
              source={
                advocateMode === "Prepare" ? Images.prepare : Images.deliver
              }
              style={ApplicationStyles.sectionTitleIcon}
            />
            <Text style={ApplicationStyles.sectionTitle}>{advocateMode}</Text>
          </View>
          <View
            style={[
              ApplicationStyles.sectionContainer,
              styles.sectionContainer
            ]}
          >
            <TopicsList screenProps={screenProps} advocateMode={advocateMode} />
          </View>
        </ImageBackground>
      </View>
    );
  }
}

export default SessionsScreen;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1
  },
  titleContainer: {
    flexDirection: "row"
  }
});

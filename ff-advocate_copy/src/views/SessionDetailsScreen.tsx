import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  Image,
  ImageSourcePropType
} from "react-native";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import { Metrics } from "../themes";
import ApplicationStyles from "./styles/ApplicationStyles";
import SessionManager from "./components/SessionManager";
import { CompletedProfileAppScreenProps } from "../types";

export interface SessionDetailsScreenParams {
  model: string;
  contentId: string;
  globalId: string;
  configName: string;
  practice: null | { title: string; url: string }[];
  delivery: null | { title: string; url: string }[];
  sessionTitle: string;
  sessionIconSource: ImageSourcePropType;
  sessionDescription: string;
}

type Props = {
  advocateMode: "Prepare" | "Deliver";
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<SessionDetailsScreenParams>;

class SessionDetailsScreen extends Component<Props> {
  render() {
    const advocateMode = this.props.advocateMode;
    const sessionModel = this.props.navigation.getParam("model", "");
    const sessionContentId = this.props.navigation.getParam("contentId", "");
    const sessionGlobalId = this.props.navigation.getParam("globalId", "");
    const configName = this.props.navigation.getParam("configName");

    const { contentUri } = this.props.screenProps;

    const sessionPrepareSection = this.props.navigation.getParam("practice");
    const sessionDeliverSection = this.props.navigation.getParam("delivery");

    const prepareSections = [
      {
        data: sessionPrepareSection
          ? sessionPrepareSection
          : [
              {
                title: "What it's all about",
                url: `${contentUri}/${sessionModel}/preparation/whats-it-all-about/index.html`
              },
              {
                title: "Checklist of things you will need",
                url: `${contentUri}/${sessionModel}/preparation/checklist/index.html`
              },
              {
                title: "Further reading on the topic of the session",
                url: `${contentUri}/${sessionModel}/preparation/further-reading/index.html`
              },
              {
                title: "Practice for the session",
                url: `${contentUri}/${sessionModel}/preparation/practice/index.html`
              }
            ],
        key: "preparation"
      }
    ];
    const deliverSections = [
      {
        data: sessionDeliverSection
          ? sessionDeliverSection
          : [
              {
                title: "Session plan",
                url: `${contentUri}/${sessionModel}/delivery/plan/index.html`
              }
            ],
        key: "delivery"
      }
    ];

    const sessionTitle = this.props.navigation.getParam("sessionTitle");
    const sessionIconSource = this.props.navigation.getParam(
      "sessionIconSource"
    );
    const sessionDescription = this.props.navigation.getParam(
      "sessionDescription"
    );

    return (
      <View style={ApplicationStyles.mainContainer}>
        <View style={ApplicationStyles.sectionContainer}>
          <View style={styles.sessionDatasContainer}>
            <Image
              source={sessionIconSource}
              style={styles.iconImage}
              resizeMode="contain"
            />
            <View style={styles.sessionDatasText}>
              <Text style={ApplicationStyles.sectionTitle}>{sessionTitle}</Text>
              <Text style={ApplicationStyles.sectionDescription}>
                {sessionDescription}
              </Text>
            </View>
          </View>

          <SectionList
            keyExtractor={(item, index) => `${index}`}
            sections={
              advocateMode === "Prepare" ? prepareSections : deliverSections
            }
            renderItem={({ item, index }) => (
              <SessionManager
                index={index}
                title={item.title}
                url={item.url}
                sessionContentId={sessionContentId}
                sessionGlobalId={sessionGlobalId}
                advocateMode={advocateMode}
                sessionModel={sessionModel}
                screenProps={this.props.screenProps}
                configName={configName}
              />
            )}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sessionDatasContainer: {
    flexDirection: "row"
  },
  sessionDatasText: {
    padding: Metrics.baseMargin,
    flex: 1
  },
  iconImage: {
    marginTop: Metrics.doubleBaseMargin,
    marginHorizontal: Metrics.baseMargin,
    width: Metrics.images.xlarge,
    height: Metrics.images.xlarge
  }
});

export default withNavigation(SessionDetailsScreen);

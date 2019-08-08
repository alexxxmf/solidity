import React, { Component } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
  Image
} from "react-native";
import ApplicationStyles from "./styles/ApplicationStyles";
import { Metrics, Images } from "../themes";
import {
  NavigationInjectedProps,
  Omit,
  withNavigation
} from "react-navigation";
import ReportAProblem from "./components/ReportAProblem";
import { CompletedProfileAppScreenProps } from "../types";
import { apiClient } from "../graphql/client";
import {
  navigateToAttendActivation,
  navigatetoHowToGuides,
  navigateToCoachCallScreen
} from "../navigation/HomeNavigation";
import Button from "./components/Button";
import { Query, QueryProps } from "react-apollo";
import {
  PROGRAMME_SUPPORTS_ACTIVATION,
  ProgrammeSupportsActivationResult,
  ProgrammeSupportsActivationVars
} from "../graphql/analytics/queries";
import Intercom from "react-native-intercom";
import {
  GetActivationDetailsComponent,
  ActivationLoader
} from "./AttendActivationScreen";
import { logger } from "../utils/logging";

export const ProgrammeSupportsActivationComponent = (
  props: Omit<
    QueryProps<
      ProgrammeSupportsActivationResult,
      ProgrammeSupportsActivationVars
    >,
    keyof {
      query: unknown;
      variables: unknown;
    }
  > & { variables?: ProgrammeSupportsActivationVars }
) => (
  <Query<ProgrammeSupportsActivationResult, ProgrammeSupportsActivationVars>
    query={PROGRAMME_SUPPORTS_ACTIVATION}
    {...props}
  />
);

type Props = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<{}>;

class HelpCentreScreen extends Component<Props> {
  render() {
    const { userEmail, userName, userId, programmeId } = this.props.screenProps;

    const variables = {
      programmeId: programmeId,
      userEmail: userEmail
    };

    return (
      <View style={ApplicationStyles.mainContainer}>
        {Platform.OS === "ios" ? <StatusBar barStyle="dark-content" /> : null}
        <View style={[ApplicationStyles.sectionContainer, styles.helpSection]}>
          <Text style={[ApplicationStyles.sectionSubTitle, styles.sectionText]}>
            How can we help?
          </Text>
        </View>
        <ProgrammeSupportsActivationComponent
          client={apiClient}
          variables={{ programmeId }}
        >
          {({ data, loading }) => {
            if (loading || !data) {
              return null;
            }
            const { programmeSupportsActivation } = data;

            return (
              <ImageBackground
                source={Images.idea}
                imageStyle={{ resizeMode: "cover" }}
                style={styles.helpCentreBackground}
              >
                <ReportAProblem
                  userId={userId}
                  userEmail={userEmail || ""}
                  userName={userName || ""}
                  intercom={Intercom}
                />
                {programmeSupportsActivation ? (
                  <View style={styles.actionGroup}>
                    <Image
                      source={Images.Group}
                      style={{
                        height: Metrics.images.xlarge,
                        width: Metrics.images.xlarge
                      }}
                      resizeMode="contain"
                    />
                    <Button
                      title="Attend activation"
                      type="outline"
                      onPress={() => {
                        navigateToAttendActivation(this.props.navigation);
                      }}
                    />
                  </View>
                ) : null}
                <View style={styles.actionGroup}>
                  <Image
                    source={Images.HowTo}
                    style={{
                      height: Metrics.images.xlarge,
                      width: Metrics.images.xlarge
                    }}
                    resizeMode="contain"
                  />
                  <Button
                    title="How to guides"
                    type="outline"
                    onPress={() => navigatetoHowToGuides(this.props.navigation)}
                  />
                </View>
                {programmeSupportsActivation ? (
                  <GetActivationDetailsComponent
                    client={apiClient}
                    variables={variables}
                    pollInterval={2000}
                    fetchPolicy="network-only"
                  >
                    {({ data, loading }) => {
                      if (loading || !data) {
                        return <ActivationLoader />;
                      }

                      logger.debug(
                        "Got Activation Details For Coach Calls",
                        data
                      );

                      const { activationDetails } = data;

                      if (!activationDetails) {
                        // TODO we'll need more in the way of programme metadata to handle this better, but this is to be done once the help center is added
                        this.props.navigation.goBack();
                        return;
                      }

                      const { requestBooking } = activationDetails;

                      const { useCoachCalls } = requestBooking;

                      return (
                        <View style={styles.actionGroup}>
                          {useCoachCalls ? (
                            <>
                              <Image
                                source={Images.HowTo}
                                style={{
                                  height: Metrics.images.xlarge,
                                  width: Metrics.images.xlarge
                                }}
                                resizeMode="contain"
                              />
                              <Button
                                title="Call a Coach"
                                type="outline"
                                onPress={() =>
                                  navigateToCoachCallScreen(
                                    this.props.navigation
                                  )
                                }
                              />
                            </>
                          ) : null}
                        </View>
                      );
                    }}
                  </GetActivationDetailsComponent>
                ) : null}
              </ImageBackground>
            );
          }}
        </ProgrammeSupportsActivationComponent>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  helpSection: {
    paddingTop: Metrics.doubleSection,
    paddingBottom: Metrics.doubleSection
  },
  sectionText: {
    textAlign: "center"
  },
  helpCentreBackground: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Metrics.section,
    paddingBottom: Metrics.screenHeight / 4,
    flex: 1,
    flexWrap: "wrap"
  },
  actionGroup: {
    alignItems: "center"
  }
});

export default withNavigation<Props>(HelpCentreScreen);

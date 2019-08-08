import { Omit } from "react-navigation";
import React, { Component } from "react";
import { Linking, View } from "react-native";
import { CompletedProfileAppScreenProps } from "../types";
import { Fonts, Images, Metrics } from "../themes";
import { Query, QueryProps } from "react-apollo";
import {
  GET_COACH_CALLS_DETAILS,
  GetListUpcomingCoachCalls,
  GetCoachCallsResult
} from "../graphql/analytics/queries";
import Loader from "./components/Loader";
import CustomButton from "./components/Button";
import { onboardingClient, apiClient } from "../graphql/client";
import * as _ from "lodash";
import styled from "styled-components/native";
import { logger } from "../utils/logging";
import ApplicationStyles from "./styles/ApplicationStyles";
import { isFuture, subMinutes } from "date-fns";
import Countdown from "react-countdown-now";
import { countdownMessage } from "../utils/countdownMessage";
import { ListUserProgrammesComponent } from "./AttendActivationScreen";

interface Props {
  screenProps: CompletedProfileAppScreenProps;
}

const GetCoachCallsComponent = (
  props: Omit<
    QueryProps<GetCoachCallsResult, GetListUpcomingCoachCalls>,
    keyof {
      query: unknown;
      variables: unknown;
    }
  > & { variables?: GetListUpcomingCoachCalls }
) => (
  <Query<GetCoachCallsResult, GetListUpcomingCoachCalls>
    query={GET_COACH_CALLS_DETAILS}
    {...props}
  />
);

const NoScheduledCalls = () => {
  return <NoScheduledCall>No calls currently scheduled.</NoScheduledCall>;
};

interface NextCoachCallCountdownProps {
  dateOfNextCall: Date;
  callMessage: string;
  callUrl?: string;
}

const NextCoachCallCountdown = ({
  dateOfNextCall,
  callMessage,
  callUrl
}: NextCoachCallCountdownProps) => {
  const availableFrom = subMinutes(dateOfNextCall, 10);
  return (
    <>
      <BookingCountdownWrapper>
        <Countdown
          date={dateOfNextCall}
          renderer={({ hours, days, minutes, seconds, completed }) => {
            if (!completed) {
              return (
                <>
                  <ActivationTiming>
                    Your next coach call starts in...
                  </ActivationTiming>
                  <ActivationTiming>
                    {countdownMessage(days, hours, minutes, seconds)}
                  </ActivationTiming>
                </>
              );
            }
            return (
              <ActivationTiming>Your next coach call is live.</ActivationTiming>
            );
          }}
        />
      </BookingCountdownWrapper>
      <CustomButton
        type="outline"
        disabled={isFuture(availableFrom)}
        title={callMessage}
        onPress={() => {
          if (callUrl) {
            return Linking.openURL(callUrl);
          }
        }}
      />
    </>
  );
};

class CoachCallScreen extends Component<Props> {
  render() {
    return (
      <View style={ApplicationStyles.mainContainer}>
        <Backdrop source={Images.idea} imageStyle={{ resizeMode: "cover" }}>
          <ScrollOverIllustration>
            <View style={ApplicationStyles.sectionContainer}>
              <ListUserProgrammesComponent
                client={onboardingClient}
                variables={{ userEmail: this.props.screenProps.userEmail }}
                fetchPolicy="network-only"
              >
                {listResult => {
                  if (listResult.loading) {
                    return <ActivationLoader />;
                  }
                  if (!listResult.data) {
                    return <ActivationLoader />;
                  }

                  const currentProgramme = _.filter(
                    listResult.data.listUserProgrammes.programmes,
                    programme => programme.currentProgramme
                  )[0];

                  const programmeId = currentProgramme.programmeId;

                  const variables = {
                    programmeId: programmeId,
                    userEmail: this.props.screenProps.userEmail
                  };

                  logger.debug("Loading Coach Calls Details", variables);

                  return (
                    <GetCoachCallsComponent
                      client={apiClient}
                      variables={{ programmeId: programmeId }}
                      fetchPolicy="network-only"
                    >
                      {({ data, loading }) => {
                        if (loading || !data) {
                          return <ActivationLoader />;
                        }

                        logger.debug("Got Calls Details", data);

                        const { listUpcomingCoachCalls } = data;

                        const { count, calls } = listUpcomingCoachCalls;

                        return (
                          <>
                            <HeaderImage source={Images.CoachCall} />
                            {!count ? (
                              <NoScheduledCalls />
                            ) : (
                              <NextCoachCallCountdown
                                dateOfNextCall={new Date(calls[0].callStarts)}
                                callUrl={calls[0].callUrl}
                                callMessage={calls[0].callMessage}
                              />
                            )}
                          </>
                        );
                      }}
                    </GetCoachCallsComponent>
                  );
                }}
              </ListUserProgrammesComponent>
            </View>
          </ScrollOverIllustration>
        </Backdrop>
      </View>
    );
  }
}

const ActivationLoader = styled(Loader)`
  margin: 30px;
`;

const ActivationTiming = styled.Text`
  font-family: ${Fonts.family.name};
  font-size: 20px;
  text-align: center;
  line-height: 28px;
  padding-top: 15px;
`;

const NoScheduledCall = styled.Text`
  font-family: ${Fonts.family.name};
  text-align: center;
  font-size: ${Fonts.size.sectionHeaderLarge};
  font-weight: ${Fonts.style.sectionHeaderLarge.fontWeight};
  padding-top: ${Metrics.doublePadding};
`;

const Backdrop = styled.ImageBackground`
  flex: 1;
`;

const HeaderImage = styled.Image`
  align-self: center;
  height: 180px;
  width: 280px;
`;

const BookingCountdownWrapper = styled.View`
  margin-bottom: ${Metrics.tripleBaseMargin};
`;

const ScrollOverIllustration = styled.ScrollView`
  margin-bottom: 50%;
`;

export default CoachCallScreen;

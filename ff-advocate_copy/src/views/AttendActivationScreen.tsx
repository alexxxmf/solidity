import {
  NavigationInjectedProps,
  Omit,
  withNavigation
} from "react-navigation";
import React, { Component } from "react";
import { Linking, Text, View } from "react-native";
import { CompletedProfileAppScreenProps } from "../types";
import { Fonts, Images } from "../themes";
import { Query, QueryProps } from "react-apollo";
import {
  ActivationBooking,
  ActivationRequestBooking,
  GET_ACTIVATION_DETAILS,
  GetActivationDetailsResult,
  GetActivationDetailsVars
} from "../graphql/analytics/queries";
import Loader from "./components/Loader";
import CustomButton from "./components/Button";
import { onboardingClient, apiClient } from "../graphql/client";
import {
  LIST_USER_PROGRAMMES,
  ListUserProgrammesResult,
  ListUserProgrammesVars
} from "../graphql/auth/queries";
import * as _ from "lodash";
import styled from "styled-components/native";
import { logger } from "../utils/logging";
import ApplicationStyles from "./styles/ApplicationStyles";
import { isFuture, subMinutes } from "date-fns";
import Countdown from "react-countdown-now";
import { countdownMessage } from "../utils/countdownMessage";

type Props = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<{}>;

export const GetActivationDetailsComponent = (
  props: Omit<
    QueryProps<GetActivationDetailsResult, GetActivationDetailsVars>,
    keyof {
      query: unknown;
      variables: unknown;
    }
  > & { variables?: GetActivationDetailsVars }
) => (
  <Query<GetActivationDetailsResult, GetActivationDetailsVars>
    query={GET_ACTIVATION_DETAILS}
    {...props}
  />
);

export const ListUserProgrammesComponent = (
  props: Omit<
    QueryProps<ListUserProgrammesResult, ListUserProgrammesVars>,
    keyof { query: unknown; variables: unknown }
  > & { variables?: ListUserProgrammesVars }
) => (
  <Query<ListUserProgrammesResult, ListUserProgrammesVars>
    query={LIST_USER_PROGRAMMES}
    {...props}
  />
);

const RequestActivationBooking = ({
  requestBooking
}: {
  requestBooking: ActivationRequestBooking;
}) => (
  <CustomButton
    type="outline"
    disabled={!requestBooking.enabled}
    title={requestBooking.requestMessage}
    onPress={() => {
      if (requestBooking.requestUrl) {
        return Linking.openURL(requestBooking.requestUrl);
      }
    }}
  />
);

interface BookedActivationProps {
  bookedActivation: ActivationBooking;
}

const BookedActivation = ({ bookedActivation }: BookedActivationProps) => {
  const bookingStarts = new Date(bookedActivation.bookingStarts);
  const availableFrom = subMinutes(bookingStarts, 10);

  return (
    <>
      <BookingCountdownWrapper>
        <Countdown
          date={bookingStarts}
          renderer={({ hours, days, minutes, seconds, completed }) => {
            if (!completed) {
              return (
                <>
                  <ActivationTiming>
                    Your activation starts in...
                  </ActivationTiming>
                  <ActivationTiming>
                    {countdownMessage(days, hours, minutes, seconds)}
                  </ActivationTiming>
                </>
              );
            }
            return (
              <ActivationTiming>
                Your activation is ready to begin
              </ActivationTiming>
            );
          }}
        />
      </BookingCountdownWrapper>
      <CustomButton
        type="outline"
        disabled={isFuture(availableFrom)}
        title={bookedActivation.bookingMessage}
        onPress={() => {
          if (bookedActivation.bookingUrl) {
            return Linking.openURL(bookedActivation.bookingUrl);
          }
        }}
      />
    </>
  );
};

class AttendActivationScreen extends Component<Props> {
  render() {
    return (
      <View style={ApplicationStyles.mainContainer}>
        <Backdrop source={Images.idea} imageStyle={{ resizeMode: "cover" }}>
          <ScrollOverIllustration>
            <View style={ApplicationStyles.sectionContainer}>
              <Text style={ApplicationStyles.sectionTitle}>
                Attend Activation
              </Text>
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

                  logger.debug("Loading Activation Details", variables);

                  return (
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

                        logger.debug("Got Activation Details", data);

                        const { activationDetails } = data;

                        if (!activationDetails) {
                          // TODO we'll need more in the way of programme metadata to handle this better, but this is to be done once the help center is added
                          this.props.navigation.goBack();
                          return;
                        }

                        const {
                          bookedActivation,
                          requestBooking
                        } = activationDetails;

                        return (
                          <>
                            <HeaderImage source={Images.deliver} />
                            {bookedActivation ? (
                              <BookedActivation
                                bookedActivation={bookedActivation}
                              />
                            ) : (
                              <RequestActivationBooking
                                requestBooking={requestBooking}
                              />
                            )}
                          </>
                        );
                      }}
                    </GetActivationDetailsComponent>
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

export const ActivationLoader = styled(Loader)`
  margin: 30px;
`;

const ActivationTiming = styled.Text`
  font-family: ${Fonts.family.name};
  font-size: 20px;
  text-align: center;
  line-height: 28px;
`;

const Backdrop = styled.ImageBackground`
  flex: 1;
`;

const HeaderImage = styled.Image`
  align-self: center;
`;

const BookingCountdownWrapper = styled.View`
  margin-bottom: 30px;
`;

const ScrollOverIllustration = styled.ScrollView`
  margin-bottom: 50%;
`;

export default withNavigation(AttendActivationScreen);

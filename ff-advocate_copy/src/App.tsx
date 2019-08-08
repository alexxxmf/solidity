import * as React from "react";
import AsyncStorage from "@react-native-community/async-storage";
import SplashScreen from "react-native-splash-screen";
import { ApolloProvider } from "react-apollo";
import { onboardingClient, analyticsClient, apiClient } from "./graphql/client";
import RootContainer from "./views/RootContainer";
import { logSessionCompletedEvent } from "./utils/intercom";
import {
  LOG_DELIVERED_SESSION_MUTATION,
  LogDeliveredSessionResult,
  LogDeliveredSessionVars
} from "./graphql/analytics/mutations";
import ErrorBoundary from "./views/ErrorBoundary";
import UserOptions, {
  UpdateUserOptionsArgs
} from "./views/components/UserOptions";
import Loader from "./views/components/Loader";
import { storageKeys } from "./config/storageKeys";
import AnalyticsProvider, {
  onFirstLaunch,
  onLaunch
} from "./views/AnalyticsProvider";
import AnalyticsContext from "./views/AnalyticsContext";
import { NetworkProvider, NetworkConsumer } from "react-native-offline";
import Offline from "./views/components/Offline";
import {
  NavigationParams,
  NavigationRoute,
  NavigationScreenProp
} from "react-navigation";
import {
  UpdateCurrentProgrammeResult,
  UPDATE_CURRENT_PROGRAMME_MUTATION,
  UpdateCurrentProgrammeVars,
  UserOptions as UserOptionsType
} from "./graphql/auth/mutations";
import { LIST_USER_PROGRAMMES } from "./graphql/auth/queries";
import _ from "lodash";
import Intercom from "react-native-intercom";
import {
  DeliveredSession,
  DeliveredSessionOptions,
  PendingSessionAttendanceCount
} from "./types";
import { logger } from "./utils/logging";
import { tryRemoveStorageItem } from "./utils/storage";
import { logActivity } from "./utils/activities";
import UUIDGenerator from "react-native-uuid-generator";

interface SessionDeliveries {
  [key: string]: DeliveredSession[];
}

interface Props {}

interface State {
  pendingSessionAttendanceCount: PendingSessionAttendanceCount;
  loadingLocalData: boolean;
  sessionDeliveries: SessionDeliveries;
  initialDeviceInfoLoaded: boolean;
  deliveryLocation: string | null;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      loadingLocalData: true,
      pendingSessionAttendanceCount: {},
      sessionDeliveries: {},
      initialDeviceInfoLoaded: false,
      deliveryLocation: null
    };
  }

  setSessionAndParticipantsCount = (
    session: string,
    participantsCount: number
  ): void => {
    this.setState(
      {
        pendingSessionAttendanceCount: { [session]: participantsCount }
      },
      async () => {
        await AsyncStorage.setItem(
          storageKeys.pendingSessionAttendanceCount,
          JSON.stringify(this.state.pendingSessionAttendanceCount)
        );
      }
    );
    logger.debug(
      `Session participants count set to local storage,
      ${this.state.pendingSessionAttendanceCount}`
    );
  };

  setSessionDeliveryLocation = (deliveryLocation: string): void => {
    this.setState(
      {
        deliveryLocation: deliveryLocation
      },
      async () => {
        await AsyncStorage.setItem(
          storageKeys.deliveryLocation,
          JSON.stringify(deliveryLocation)
        );
      }
    );
    logger.debug(
      `Session delivery location set to local storage, ${deliveryLocation}`
    );
  };

  _updateParticipantsAttendance = async (
    userEmail: string,
    userId: string,
    userName: string,
    brandingTitle: string,
    topicTitle: string,
    sessionStart: Date,
    sessionEnd: Date,
    topicUniqueId: string,
    topicContentId: string,
    configName: string,
    uri: string
  ): Promise<void> => {
    const participantsCount =
      this.state.pendingSessionAttendanceCount[topicTitle] || 0;

    const deliveryLocation = this.state.deliveryLocation;

    const sessionDeliveryRecord = {
      userEmail,
      session: topicTitle,
      sessionStart,
      sessionEnd,
      participantsCount,
      deliveryLocation
    };

    // Remove this session from the pending data
    const pendingSessionAttendanceCount = {
      ...this.state.pendingSessionAttendanceCount
    };
    delete pendingSessionAttendanceCount[topicTitle];

    this.setState(
      {
        pendingSessionAttendanceCount,
        sessionDeliveries: {
          ...this.state.sessionDeliveries,
          [topicTitle]: [
            ...(this.state.sessionDeliveries[topicTitle] || []),
            sessionDeliveryRecord
          ]
        }
      },
      async () => {
        await AsyncStorage.setItem(
          storageKeys.pendingSessionAttendanceCount,
          JSON.stringify(this.state.pendingSessionAttendanceCount)
        );
        await AsyncStorage.setItem(
          storageKeys.sessionDeliveries,
          JSON.stringify(this.state.sessionDeliveries)
        );
      }
    );
    logger.debug(
      `Pending session attendance and session deliveries set to local storage,
      session attendance: ${this.state.pendingSessionAttendanceCount},
      session deliveries: ${this.state.sessionDeliveries}`
    );
    const clientId = await UUIDGenerator.getRandomUUID();
    await apiClient.mutate<LogDeliveredSessionResult, LogDeliveredSessionVars>({
      mutation: LOG_DELIVERED_SESSION_MUTATION,
      variables: {
        userEmail,
        sessionId: topicTitle,
        sessionStart: sessionStart.toISOString(),
        sessionEnd: sessionEnd.toISOString(),
        participants: JSON.stringify([]),
        participantsCount: participantsCount ? participantsCount : undefined,
        extra: JSON.stringify({
          deliveryLocation: deliveryLocation,
          userId,
          userName,
          brandingTitle,
          topicUniqueId,
          topicContentId,
          configName,
          uri
        }),
        clientId
      }
    });
    logger.debug(`LOG_DELIVERED_SESSION_MUTATION completed`);
  };

  onCompletedSessionDelivery = async (
    options: DeliveredSessionOptions
  ): Promise<void> => {
    // Log session completed in Intercom CRM
    await logSessionCompletedEvent(
      options.userId,
      options.userEmail,
      options.topicTitle,
      options.sessionStart,
      options.sessionEnd
    );
    // Store session completion in permanent record
    await this._updateParticipantsAttendance(
      options.userEmail,
      options.userId,
      options.userName,
      options.brandingTitle,
      options.topicTitle,
      options.sessionStart,
      options.sessionEnd,
      options.topicUniqueId,
      options.topicContentId,
      options.configName,
      options.uri
    );
  };

  onCompletedSessionPrepare = async (
    userId: string,
    userEmail: string,
    session: string,
    sessionStart: Date
  ): Promise<void> => {
    const sessionEnd = new Date();

    // Log session completed in Intercom CRM
    await logSessionCompletedEvent(
      userId,
      userEmail,
      session,
      sessionStart,
      sessionEnd
    );
  };

  async componentDidMount() {
    logger.info("App Mounting");
    SplashScreen.hide();

    const pendingSessionAttendanceCount = await AsyncStorage.getItem(
      storageKeys.pendingSessionAttendanceCount
    );

    const deliveryLocation = await AsyncStorage.getItem(
      storageKeys.deliveryLocation
    );

    logger.debug("Restored app launch data", {
      pendingSessionAttendanceCount,
      deliveryLocation
    });

    deliveryLocation
      ? this.setState({ deliveryLocation: JSON.parse(deliveryLocation) })
      : null;
    pendingSessionAttendanceCount
      ? this.setState({
          pendingSessionAttendanceCount: JSON.parse(
            pendingSessionAttendanceCount
          )
        })
      : null;

    this.setState({ loadingLocalData: false });
  }

  changeProgrammeById = async (
    updateUserOptions: (options: UpdateUserOptionsArgs) => Promise<void>,
    email: string,
    programmeId: number,
    navigation: NavigationScreenProp<
      NavigationRoute<NavigationParams>,
      NavigationParams
    >
  ) => {
    const result = await onboardingClient.mutate<
      UpdateCurrentProgrammeResult,
      UpdateCurrentProgrammeVars
    >({
      mutation: UPDATE_CURRENT_PROGRAMME_MUTATION,
      variables: {
        userEmail: email,
        programmeId
      },
      refetchQueries: [
        {
          query: LIST_USER_PROGRAMMES,
          variables: {
            userEmail: email
          }
        }
      ]
    });

    if (!result.data) {
      logger.warn(
        `UPDATE_CURRENT_PROGRAMME_MUTATION failed with ${email} ${programmeId}`
      );
      return;
    }

    const userOptions = result.data.switchCurrentProgramme;

    await this.changeProgrammeByOptions(
      updateUserOptions,
      userOptions,
      navigation
    );
    logger.info(`[changeProgrammeById] completed`, userOptions);
  };

  changeProgrammeByOptions = async (
    updateUserOptions: (options: UpdateUserOptionsArgs) => Promise<void>,
    userOptions: UserOptionsType,
    navigation: NavigationScreenProp<
      NavigationRoute<NavigationParams>,
      NavigationParams
    >
  ) => {
    // Remove programme related storage items
    await tryRemoveStorageItem(AsyncStorage, storageKeys.deliveryLocation);
    await tryRemoveStorageItem(
      AsyncStorage,
      storageKeys.pendingSessionAttendance
    );
    await tryRemoveStorageItem(
      AsyncStorage,
      storageKeys.pendingSessionAttendanceCount
    );
    await tryRemoveStorageItem(AsyncStorage, storageKeys.sessionDeliveries);

    await updateUserOptions(userOptions);

    logger.debug(`[changeProgrammeByOptions] completed`);

    // Navigating to the WelcomeScreen forces the reset of the home (tab) navigator. It won't actually display the Welcome screen.
    navigation.navigate("WelcomeScreen");
    navigation.navigate("HomeScreen");
  };

  _handleUpdatedUserOptions = async ({
    userEmail,
    userName,
    userOptionsLoaded
  }: {
    userEmail: string | null;
    userName: string | null;
    userOptionsLoaded: boolean;
  }) => {
    if (userOptionsLoaded && userEmail && userName) {
      await Intercom.updateUser({
        email: userEmail,
        name: userName,
        custom_attributes: {
          digitalmentor: "true"
        }
      });
    }
  };

  render() {
    const screenProps = {
      loadingLocalData: this.state.loadingLocalData,
      deliveryLocation: this.state.deliveryLocation,
      setSessionAndParticipantsCount: this.setSessionAndParticipantsCount,
      setSessionDeliveryLocation: this.setSessionDeliveryLocation,
      onCompletedSessionPrepare: this.onCompletedSessionPrepare,
      onCompletedSessionDelivery: this.onCompletedSessionDelivery
    };
    return (
      <NetworkProvider
        pingTimeout={500}
        pingInterval={5000}
        pingOnlyIfOffline={true}
        pingInBackground={true}
      >
        <NetworkConsumer>
          {({ isConnected }) =>
            isConnected ? (
              <UserOptions
                onUpdatedUserOptions={this._handleUpdatedUserOptions}
                render={({
                  brandingTitle,
                  contentUri,
                  resetUserOptionsToDefault,
                  sessionsUri,
                  theme,
                  updateUserOptions,
                  setUserEmail,
                  userId,
                  userEmail,
                  userName,
                  programmeId,
                  userOptionsLoaded,
                  deliveryMetadata
                }) => {
                  if (userOptionsLoaded) {
                    return (
                      <ApolloProvider client={onboardingClient}>
                        <ErrorBoundary>
                          <AnalyticsProvider
                            userEmail={userEmail}
                            brandingTitle={brandingTitle}
                            userId={userId || ""}
                            userName={userName || ""}
                            client={onboardingClient}
                            onLogActivity={_.partial(
                              logActivity,
                              analyticsClient
                            )}
                          >
                            <AnalyticsContext.Consumer>
                              {context =>
                                context && (
                                  <RootContainer
                                    context={context}
                                    screenProps={{
                                      ...screenProps,
                                      brandingTitle,
                                      contentUri,
                                      resetUserOptionsToDefault,
                                      sessionsUri,
                                      theme,
                                      updateUserOptions,
                                      setUserEmail,
                                      userId,
                                      userEmail,
                                      userName,
                                      programmeId,
                                      deliveryMetadata,
                                      changeProgrammeById: _.partial(
                                        this.changeProgrammeById,
                                        updateUserOptions
                                      ),
                                      changeProgrammeByOptions: _.partial(
                                        this.changeProgrammeByOptions,
                                        updateUserOptions
                                      )
                                    }}
                                    onLoaded={async () => {
                                      const firstLaunchDone = await AsyncStorage.getItem(
                                        storageKeys.firstLaunchDone
                                      );

                                      if (firstLaunchDone !== "done") {
                                        await AsyncStorage.setItem(
                                          storageKeys.firstLaunchDone,
                                          "done"
                                        );
                                        onFirstLaunch(context);
                                      }
                                      onLaunch(context);
                                    }}
                                  />
                                )
                              }
                            </AnalyticsContext.Consumer>
                          </AnalyticsProvider>
                        </ErrorBoundary>
                      </ApolloProvider>
                    );
                  } else {
                    return <Loader />;
                  }
                }}
              />
            ) : (
              <Offline />
            )
          }
        </NetworkConsumer>
      </NetworkProvider>
    );
  }
}
export default App;

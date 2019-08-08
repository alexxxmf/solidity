import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  TextStyle
} from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import {
  NavigationInjectedProps,
  NavigationParams,
  withNavigation
} from "react-navigation";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { Colors, Metrics, Fonts } from "../themes";
import { ErrorText } from "./styles/FormStyle";
import { onboardingClient } from "../graphql/client";
import branch from "react-native-branch";
import { logger } from "../utils/logging";
import {
  CheckLoginTokenResult,
  CheckLoginTokenVars,
  CHECK_LOGIN_TOKEN,
  UserOptions
} from "../graphql/auth/mutations";
import { storageKeys } from "../config/storageKeys";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import { CompletedProfileAppScreenProps } from "../types";
import { openInbox } from "react-native-email-link";
import Button from "./components/Button";
import { onLoginComplete, onTokenError } from "./AnalyticsProvider";

type PropsNoContext = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<NavigationParams>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

interface State {
  tokenError: boolean;
  tokenLoading: boolean;
}

class OnBoardingPendingScreen extends Component<Props, State> {
  state = {
    tokenError: false,
    tokenLoading: false
  };

  branchUnsubscribe: (() => void) | null = null;

  _subscribeFromBranch = () => {
    this.branchUnsubscribe = branch.subscribe(async ({ error, params }) => {
      if (error) {
        this.setState({ tokenError: true });

        if (
          error.toLowerCase().includes("trouble reaching the branch servers")
        ) {
          return;
        }
        logger.error(`[Branch error]: ${error}`);
        return;
      }

      if (params["+clicked_branch_link"]) {
        if (params["token"]) {
          if (params["cached_initial_event"]) {
            logger.debug(`User clicked email link with token`);
            return;
          }
          await this._checkTokenFromBranch(params["token"]);
          return;
        } else {
          logger.warn(`No token provided in login email link`);
          this.setState({ tokenError: true });
        }
      }
    });
  };

  _checkTokenFromBranch = async (token: string) => {
    this.setState({ tokenLoading: true });
    const response = await onboardingClient.mutate<
      CheckLoginTokenResult,
      CheckLoginTokenVars
    >({
      mutation: CHECK_LOGIN_TOKEN,
      variables: {
        token
      }
    });

    if (!response.data) {
      logger.warn("CHECK_LOGIN_TOKEN mutation failed with", token);
      return;
    }

    const {
      userOptions,
      valid,
      persistentUserToken
    } = response.data.checkLoginToken;

    if (valid) {
      logger.debug("Token valid, redirected to home screen");
      await this._redirectToHomeScreen(userOptions, persistentUserToken);
    } else {
      onTokenError(this.props.context);

      this.setState({ tokenError: true });
    }
  };

  _redirectToHomeScreen = async (
    userOptions: UserOptions,
    persistentUserToken: string
  ) => {
    // We only redirect if the incoming event was for the same user who just filled in the sign in screen
    const { userEmail } = this.props.screenProps;
    if (userOptions.email !== userEmail) {
      logger.warn(
        "Link from different email than the one signed up with clicked",
        userEmail,
        userOptions.email
      );
      this.setState({ tokenLoading: false });
      return;
    }

    await AsyncStorage.setItem(storageKeys.USER_EMAIL, userOptions.email);
    await AsyncStorage.setItem(
      storageKeys.persistentUserToken,
      persistentUserToken
    );
    await this.props.screenProps.updateUserOptions(userOptions);

    onLoginComplete(this.props.context);
    this.setState({ tokenLoading: false });

    if (
      !userOptions.userName ||
      userOptions.userName.length === 0 ||
      userOptions.userName.toLowerCase() === "ff-force-welcome"
    ) {
      this.props.navigation.navigate("WelcomeProfileScreen");
    } else {
      this.props.navigation.navigate("HomeScreen");
    }
  };

  async componentDidMount() {
    this._subscribeFromBranch();
  }

  componentWillUnmount(): void {
    if (this.branchUnsubscribe) {
      // TODO the subscription callback itself needs to be stopped here
      this.branchUnsubscribe();
      this.branchUnsubscribe = null;
    }
  }

  render() {
    const { tokenError, tokenLoading } = this.state;
    const { userEmail } = this.props.screenProps;

    return (
      <View style={styles.keyboardContainer}>
        <View style={styles.formContainer}>
          {tokenError ? (
            <>
              <FaIcon
                name="exclamation-triangle"
                size={Metrics.icons.large}
                style={styles.emailIcon}
                solid
              />
              <Text style={styles.title as StyleProp<TextStyle>}>
                Sorry about this
              </Text>
              <ErrorText
                style={{
                  textAlign: "center",
                  marginBottom: Metrics.doubleSection
                }}
              >
                We encounter an error{"\n"}with your magic link.
              </ErrorText>
              <Text style={styles.indications}>
                Please send another email{"\n"}and try again.
              </Text>
            </>
          ) : (
            <>
              {tokenLoading ? (
                <>
                  <FaIcon
                    name="hourglass-half"
                    size={Metrics.icons.large}
                    style={styles.emailIcon}
                    solid
                  />
                  <Text style={styles.title as StyleProp<TextStyle>}>
                    Checking your email
                  </Text>
                  <Text style={styles.indications}>
                    Sign-in with the email
                    <Text style={styles.emailText}>{` ${userEmail}`}</Text>
                  </Text>
                  <Text style={styles.indications}>
                    We are checking your email and loading your programme
                  </Text>
                </>
              ) : (
                <>
                  <FaIcon
                    name="paper-plane"
                    size={Metrics.icons.large}
                    style={styles.emailIcon}
                    solid
                  />
                  <Text style={styles.title as StyleProp<TextStyle>}>
                    Check your email
                  </Text>
                  <Text style={styles.indications}>
                    We sent an email to you at
                    <Text style={styles.emailText}>{` ${userEmail}`}</Text>
                  </Text>
                  <Text style={styles.indications}>
                    Check your inbox and use the magic link to sign in.
                  </Text>
                </>
              )}
            </>
          )}
        </View>
        <Button
          title="Open email app"
          style={styles.openLinkButton}
          onPress={() => {
            openInbox();
          }}
        />
        {tokenLoading ? (
          <View style={styles.backLinkContainer}>
            <ActivityIndicator
              color={Colors.white}
              size="large"
              style={{ marginVertical: Metrics.doubleBaseMargin }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.backLinkContainer}
            onPress={() => {
              this.props.navigation.navigate("OnboardingSignInScreen");
            }}
          >
            <Text style={styles.backLink}>Send another email</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: Metrics.doubleBaseMargin
  },
  formContainer: {
    flex: 4,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  emailIcon: {
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin
  },
  title: {
    ...Fonts.style.sectionHeaderLarge,
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin
  },
  indications: {
    ...Fonts.style.sectionHeaderSmall,
    lineHeight: Fonts.size.large + 5,
    color: Colors.white,
    marginBottom: Metrics.doubleSection,
    textAlign: "center"
  },
  emailText: {
    fontWeight: "bold"
  },
  backLinkContainer: {
    flex: 1,
    justifyContent: "center"
  },
  openLinkButton: {
    minWidth: 280
  },
  backLink: {
    ...Fonts.style.normal,
    color: Colors.white,
    fontWeight: "bold"
  }
});

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context =>
      context && <OnBoardingPendingScreen {...props} context={context} />
    }
  </AnalyticsContext.Consumer>
));

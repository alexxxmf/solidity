import React, { Component } from "react";
import { StyleSheet, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import { NavigationInjectedProps, NavigationParams } from "react-navigation";
import { Colors, Metrics, Fonts } from "../../../themes";
import branch from "react-native-branch";
import Intercom from "react-native-intercom";
import { storageKeys } from "../../../config/storageKeys";
import AnalyticsContext, {
  AnalyticsContextValue
} from "../../AnalyticsContext";
import { allClients } from "../../../graphql/client";
import { onStartSignOut } from "../../AnalyticsProvider";
import { logger } from "../../../utils/logging";
import { tryRemoveStorageItem } from "../../../utils/storage";

type PropsNoContext = {
  resetUserOptionsToDefault: () => Promise<void>;
} & NavigationInjectedProps<NavigationParams>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

export class SignOutInner extends Component<Props> {
  async _wipeUser() {
    logger.debug("Wiping user for sign out");

    await tryRemoveStorageItem(AsyncStorage, storageKeys.USER_EMAIL);
    await tryRemoveStorageItem(AsyncStorage, storageKeys.USER_NAME);
    await tryRemoveStorageItem(AsyncStorage, storageKeys.eventLog);
    await tryRemoveStorageItem(AsyncStorage, storageKeys.deliveryLocation);
    await tryRemoveStorageItem(AsyncStorage, storageKeys.persistentUserToken);

    logger.debug("Logging out of Branch");
    branch.logout();

    logger.debug("Logging out of Intercom");
    await Intercom.logout();

    onStartSignOut(this.props.context);

    logger.debug("Clearing GraphQL stores");
    await Promise.all(
      allClients.map(c => {
        return c.clearStore();
      })
    );

    logger.debug("Navigating back to sign in screen");
    this.props.navigation.navigate("OnboardingSignInScreen");

    logger.debug("Resetting user options to default");
    await this.props.resetUserOptionsToDefault();
  }

  render() {
    return (
      <Text
        style={styles.signOut}
        onPress={() => {
          Alert.alert(
            "Sign Out",
            "Do you really want to sign out?",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Yes",
                onPress: async () => {
                  await this._wipeUser();
                }
              }
            ],
            { cancelable: true }
          );
        }}
      >
        Sign out
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  signOut: {
    ...Fonts.style.description,
    color: Colors.error,
    padding: Metrics.smallMargin,
    marginTop: Metrics.smallMargin
  }
});

const SignOut = (props: PropsNoContext) => (
  <AnalyticsContext.Consumer>
    {context => context && <SignOutInner {...props} context={context} />}
  </AnalyticsContext.Consumer>
);

export default SignOut;

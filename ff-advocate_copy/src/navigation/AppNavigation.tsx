import React from "react";
import { createSwitchNavigator } from "react-navigation";

import OnboardingScreen from "../views/OnboardingScreen";
import OnboardingSignInScreen from "../views/OnboardingSignInScreen";
import OnboardingPendingScreen from "../views/OnboardingPendingScreen";
import HomeNavigation from "./HomeNavigation";
import WelcomeScreen from "../views/WelcomeScreen";
import WelcomeProfileScreen from "../views/WelcomeProfileScreen";
import { AppScreenProps } from "../types";

// IMPORTANT: Update this when re-architecting view structure
export const persistenceKey = "newKey11";

const AppNavigation = createSwitchNavigator(
  {
    OnboardingScreen: {
      screen: OnboardingScreen
    },
    OnboardingSignInScreen: {
      screen: OnboardingSignInScreen
    },
    OnboardingPendingScreen: {
      screen: OnboardingPendingScreen
    },
    WelcomeScreen: {
      screen: WelcomeScreen
    },
    WelcomeProfileScreen: {
      screen: WelcomeProfileScreen
    },
    HomeScreen: {
      screen: HomeNavigation,
      navigationOptions: () => ({
        header: null
      })
    }
  },
  {
    initialRouteName: "OnboardingScreen"
  }
) as React.ComponentClass<{
  screenProps: AppScreenProps;
  persistenceKey: string;
}>;

export default AppNavigation;

import React from "react";
import {
  BottomTabNavigatorConfig,
  createBottomTabNavigator,
  createStackNavigator,
  NavigationInjectedProps,
  StackNavigatorConfig,
  TabViewConfig,
  NavigationScreenProp,
  NavigationRoute,
  NavigationParams
} from "react-navigation";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { StackViewStyleInterpolator } from "react-navigation-stack";

import { Colors, Metrics, Fonts } from "../themes";

import TopBarLogo from "../views/components/TopBarLogo";
import Timer from "../views/components/Timer";

import SessionsScreen from "../views/SessionsScreen";
import SessionDetailsScreen, {
  SessionDetailsScreenParams
} from "../views/SessionDetailsScreen";
import UrlWebviewScreen from "../views/UrlWebviewScreen";
import FeedbackScreen, { FeedbackScreenParams } from "../views/FeedbackScreen";
import FeedbackThankYouScreen from "../views/FeedbackThankYouScreen";
import ProfileScreen from "../views/ProfileScreen";
import AttributesScreen from "../views/AttributesScreen";
import AttributeDetailScreen, {
  AttributeDetailScreenParams
} from "../views/AttributeDetailScreen";
import ParticipantsRegisterScreen, {
  ParticipantsRegisterScreenParams
} from "../views/ParticipantsRegisterScreen";
import DebugScreen from "../views/DebugScreen";
import { tabNavigatorConfig } from "./StyleNavigation";
import { CompletedProfileAppScreenProps } from "../types";
import ManageProgrammeMembership from "../views/ManageProgrammeMembership";
import { UrlWebviewScreenParams } from "../views/UrlWebviewScreen";
import AttendActivationScreen from "../views/AttendActivationScreen";
import CoachCallScreen from "../views/CoachCallScreen";
import { StyleSheet, TouchableOpacity } from "react-native";
import HelpCentreScreen from "../views/HelpCentreScreen";
import HowToGuides from "../views/components/HowToGuides";

const stackNavigatorConfig: StackNavigatorConfig = {
  transitionConfig: () => {
    return {
      screenInterpolator: StackViewStyleInterpolator.forHorizontal
    };
  },
  navigationOptions: props => {
    if (props.navigation.state.routeName === "UrlWebviewScreen") {
      return {
        headerTitle: (
          <TopBarLogo brandingTitle={props.screenProps.brandingTitle} />
        ),
        headerRight: <Timer />,
        headerStyle: {
          backgroundColor: props.screenProps.theme.primary
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontFamily: Fonts.family.name
        }
      };
    } else {
      return {
        headerTitle: (
          <TopBarLogo brandingTitle={props.screenProps.brandingTitle} />
        ),
        headerRight: (
          <TouchableOpacity
            style={styles.touchContainer}
            onPress={() => {
              navigateToHelpCentreScreen(props.navigation);
            }}
            disabled={props.navigation.state.routeName === "HelpCentreScreen"}
          >
            <FaIcon
              name="question-circle"
              size={Metrics.icons.small}
              style={styles.supportIcon}
              solid
            />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: props.screenProps.theme.primary
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontFamily: Fonts.family.name
        }
      };
    }
  }
};

interface HomeProps {
  screenProps: CompletedProfileAppScreenProps;
}

const homeConfig = {
  navigationOptions: ({ navigation }: NavigationInjectedProps) => {
    const { routeName } = navigation.state;
    let iconName: string;
    let tabBarVisible = true;

    if (routeName === "Prepare") {
      iconName = `clock`;
    } else if (routeName === "Deliver") {
      iconName = `bullhorn`;
    } else if (routeName === "Profile") {
      iconName = `user`;
    } else if (routeName === "Support") {
      iconName = "question-circle";
    }

    let subRouteName =
      navigation.state.routes[navigation.state.index].routeName;

    if (subRouteName === "HowToGuides") {
      tabBarVisible = false;
    }

    if (routeName === "Prepare" || routeName === "Deliver") {
      if (navigation.state.routes.length >= 3) {
        tabBarVisible = false;
      }
    }

    const homeTabBarIcon = ({ tintColor }: { tintColor: string }) => (
      <FaIcon
        name={iconName}
        size={Metrics.icons.medium}
        color={tintColor}
        solid
      />
    );

    return {
      tabBarVisible,
      tabBarIcon: homeTabBarIcon
    };
  },
  ...(tabNavigatorConfig as TabViewConfig)
};

const DeliverUrlWebViewScreen = (props: HomeProps) => (
  <UrlWebviewScreen advocateMode="Deliver" screenProps={props.screenProps} />
);

const DeliverSessionDetailsScreen = (props: HomeProps) => (
  <SessionDetailsScreen
    advocateMode="Deliver"
    screenProps={props.screenProps}
  />
);

const DeliverSessionsScreen = (props: HomeProps) => (
  <SessionsScreen advocateMode="Deliver" screenProps={props.screenProps} />
);

const PrepareUrlWebViewScreen = (props: HomeProps) => (
  <UrlWebviewScreen advocateMode="Prepare" screenProps={props.screenProps} />
);

const PrepareSessionDetailsScreen = (props: HomeProps) => (
  <SessionDetailsScreen
    advocateMode="Prepare"
    screenProps={props.screenProps}
  />
);

const PrepareSessionsScreen = (props: HomeProps) => (
  <SessionsScreen advocateMode="Prepare" screenProps={props.screenProps} />
);

type Navigation = NavigationScreenProp<
  NavigationRoute<NavigationParams>,
  NavigationParams
>;

export const navigateToAttributeDetailScreen = async (
  navigation: Navigation,
  params: AttributeDetailScreenParams
) => {
  navigation.navigate("AttributeDetailScreen", params);
};

export const navigateToHelpCentreScreen = async (navigation: Navigation) => {
  navigation.navigate("HelpCentreScreen");
};

export const navigateToSessionDetailsScreen = async (
  navigation: Navigation,
  params: SessionDetailsScreenParams
) => {
  navigation.navigate("SessionDetailsScreen", params);
};

export const navigateToParticipantsRegisterScreen = async (
  navigation: Navigation,
  params: ParticipantsRegisterScreenParams
) => {
  navigation.navigate("ParticipantsRegisterScreen", params);
};

export const navigateToFeedbackScreen = async (
  navigation: Navigation,
  params: FeedbackScreenParams
) => {
  navigation.navigate("FeedbackScreen", params);
};

export const navigateToUrlWebviewScreen = async (
  navigation: Navigation,
  params: UrlWebviewScreenParams
) => {
  navigation.navigate("UrlWebviewScreen", params);
};

export const navigateToAttendActivation = async (navigation: Navigation) => {
  navigation.navigate("AttendActivationScreen");
};

export const navigatetoHowToGuides = async (navigation: Navigation) => {
  navigation.navigate("HowToGuides");
};

export const navigateToCoachCallScreen = async (navigation: Navigation) => {
  navigation.navigate("CoachCallScreen");
};

const HomeNavigation = createBottomTabNavigator(
  {
    Prepare: createStackNavigator(
      {
        PrepareSessions: {
          screen: PrepareSessionsScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        SessionDetailsScreen: {
          screen: PrepareSessionDetailsScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        UrlWebviewScreen: {
          screen: PrepareUrlWebViewScreen,
          navigationOptions: {
            gesturesEnabled: false
          }
        }
      },
      stackNavigatorConfig
    ),
    Deliver: createStackNavigator(
      {
        DeliverSessions: {
          screen: DeliverSessionsScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        SessionDetailsScreen: {
          screen: DeliverSessionDetailsScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        ParticipantsRegisterScreen: {
          screen: ParticipantsRegisterScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        UrlWebviewScreen: {
          screen: DeliverUrlWebViewScreen,
          navigationOptions: {
            gesturesEnabled: false
          }
        },
        FeedbackScreen: {
          screen: FeedbackScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        },
        FeedbackThankYouScreen: {
          screen: FeedbackThankYouScreen,
          navigationOptions: {
            gesturesEnabled: true
          }
        }
      },
      stackNavigatorConfig
    ),
    Profile: createStackNavigator(
      {
        ProfileScreen: {
          screen: ProfileScreen
        },
        DebugScreen: {
          screen: DebugScreen
        },
        AttributesScreen: {
          screen: AttributesScreen
        },
        AttributeDetailScreen: {
          screen: AttributeDetailScreen
        },
        ManageProgrammeMembership
      },
      stackNavigatorConfig
    ),
    Support: createStackNavigator(
      {
        HelpCentreScreen: {
          screen: HelpCentreScreen
        },
        AttendActivationScreen,
        HowToGuides,
        CoachCallScreen
      },
      stackNavigatorConfig
    )
  },
  homeConfig as BottomTabNavigatorConfig
);

export default HomeNavigation;

const styles = StyleSheet.create({
  touchContainer: {
    flexDirection: "row"
  },
  supportIcon: {
    color: Colors.white,
    paddingRight: Metrics.baseMargin
  }
});

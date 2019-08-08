import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageBackground,
  TouchableHighlight,
  StyleProp,
  TextStyle
} from "react-native";
import { Colors, Metrics, Fonts, Images } from "../themes";
import {
  NavigationInjectedProps,
  NavigationParams,
  withNavigation
} from "react-navigation";
import Button from "./components/Button";
import SignOut from "./components/profile/SignOut";
import UpdateDetails from "./components/profile/UpdateDetails";
import BuildNumber from "./components/profile/BuildNumber";
import attributeIcon from "../themes/Images";
import ApplicationStyles from "./styles/ApplicationStyles";
import { Card } from "./styles/CardStyle";
import { CompletedProfileAppScreenProps } from "../types";
import { ProfileMenuItem } from "./components/profile/ProfileMenuItem";
import { onboardingClient } from "../graphql/client";
import { storeUserName } from "../utils/profile";
import AsyncStorage from "@react-native-community/async-storage";
import * as _ from "lodash";

type Props = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<NavigationParams>;

interface State {
  debugScreenCount: number;
}

class ProfileScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      debugScreenCount: 0
    };
  }

  _triggerDebugScreen() {
    let count = this.state.debugScreenCount;
    if (count === 4) {
      this.props.navigation.navigate("DebugScreen");
      count = 0;
      this.setState({ debugScreenCount: count });
    } else {
      count += 1;
      this.setState({ debugScreenCount: count });
    }
  }

  render() {
    const { userEmail, userName, updateUserOptions } = this.props.screenProps;

    return (
      <View style={ApplicationStyles.mainContainer}>
        <ImageBackground
          source={Images.profileBg}
          style={ApplicationStyles.imageBackground}
        >
          <View
            style={[ApplicationStyles.sectionContainer, styles.titleContainer]}
          >
            <TouchableHighlight onPress={() => this._triggerDebugScreen()}>
              <Image
                source={Images.profile}
                style={ApplicationStyles.sectionTitleIcon}
              />
            </TouchableHighlight>
            <Text
              style={ApplicationStyles.sectionTitle as StyleProp<TextStyle>}
            >
              Profile
            </Text>
          </View>
          <View
            style={[
              ApplicationStyles.sectionContainer,
              styles.sectionContainer
            ]}
          >
            <Card>
              <View style={styles.gravatarContainer}>
                <View style={styles.gravatarHeader}>
                  <Text style={styles.gravatarTitleText}>{userName}</Text>
                  <Text style={styles.gravatarEmailText}>{userEmail}</Text>
                </View>
              </View>
              <UpdateDetails
                userName={userName}
                userEmail={userEmail}
                onStoreUserName={_.partial(
                  storeUserName,
                  updateUserOptions,
                  onboardingClient,
                  AsyncStorage
                )}
              />
              <ProfileMenuItem
                label="Your programmes"
                onPress={() => {
                  this.props.navigation.navigate("ManageProgrammeMembership");
                }}
              />
              <SignOut
                navigation={this.props.navigation}
                resetUserOptionsToDefault={
                  this.props.screenProps.resetUserOptionsToDefault
                }
              />
            </Card>
            <View style={styles.buttonsContainer}>
              <View style={styles.buttonWrapper}>
                <Image
                  source={attributeIcon.Explore_Future_Of_Work}
                  style={{
                    height: Metrics.images.xlarge,
                    width: Metrics.images.xlarge
                  }}
                  resizeMode="contain"
                />
                <Button
                  title="Explore attributes"
                  type="outline"
                  onPress={() => {
                    this.props.navigation.navigate("AttributesScreen");
                  }}
                />
              </View>
            </View>
            <View style={styles.buildNumberContainer}>
              <BuildNumber />
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1
  },
  titleContainer: {
    flexDirection: "row"
  },
  gravatarContainer: {
    flexDirection: "row",
    paddingBottom: Metrics.baseMargin,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1
  },
  gravatarHeader: {
    marginHorizontal: Metrics.baseMargin
  },
  gravatarTitleText: {
    ...Fonts.style.sectionHeaderSmall,
    color: Colors.grayDark,
    marginBottom: Metrics.baseMargin
  },
  gravatarEmailText: {
    ...Fonts.style.description,
    color: Colors.gray
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: "column"
  },
  buttonWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  buildNumberContainer: {
    paddingVertical: Metrics.doubleBaseMargin,
    marginTop: "auto"
  }
});

export default withNavigation(ProfileScreen);

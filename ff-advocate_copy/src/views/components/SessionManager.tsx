import React, { Component } from "react";
import { Text, TouchableOpacity } from "react-native";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import ListStyle from "../styles/ListStyle";
import { Metrics } from "../../themes";
import { CompletedProfileAppScreenProps } from "../../types";
import { UrlWebviewScreenParams } from "../UrlWebviewScreen";
import {
  navigateToUrlWebviewScreen,
  navigateToParticipantsRegisterScreen
} from "../../navigation/HomeNavigation";
import { logger } from "../../utils/logging";

type Props = {
  screenProps: CompletedProfileAppScreenProps;
  advocateMode: "Prepare" | "Deliver";
  url: string;
  index: number;
  title: string;
  sessionContentId: string;
  sessionGlobalId: string;
  sessionModel: string;
  configName: string;
} & NavigationInjectedProps<{}>;

class SessionManager extends Component<Props> {
  render() {
    const {
      index,
      title,
      url,
      advocateMode,
      sessionModel,
      sessionContentId,
      sessionGlobalId,
      configName
    } = this.props;
    return (
      <TouchableOpacity
        onPress={() => {
          const params: UrlWebviewScreenParams = {
            uri: url,
            session: sessionModel,
            advocateMode: advocateMode,
            sessionContentId: sessionContentId,
            sessionGlobalId: sessionGlobalId,
            deliveryLocation: null,
            componentTitle: title,
            configName: configName,
            participantsCount: null,
            prepareDelivery: null
          };

          logger.info("Launching Adapt course / registration", params);

          advocateMode === "Prepare"
            ? navigateToUrlWebviewScreen(this.props.navigation, params)
            : navigateToParticipantsRegisterScreen(
                this.props.navigation,
                params
              );
        }}
        style={ListStyle.sectionListItem}
        key={index}
      >
        <Text style={ListStyle.sectionListText}>{title}</Text>
        <FaIcon
          name="angle-right"
          size={Metrics.icons.small}
          style={ListStyle.nextIcon}
        />
      </TouchableOpacity>
    );
  }
}

export default withNavigation<Props>(SessionManager);

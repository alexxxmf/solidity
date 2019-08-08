import React, { Component } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Metrics } from "../../themes";
import Intercom from "react-native-intercom";
import { logger } from "../../utils/logging";
import Images from "../../themes/Images";
import Button from "./Button";

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  intercom: typeof Intercom;
}

class ReportAProblem extends Component<Props> {
  async _registerUser() {
    const userIdentifier = {
      userId: this.props.userId
    };
    logger.debug("Registering Intercom Identified User", userIdentifier);
    await this.props.intercom.registerIdentifiedUser(userIdentifier);
    const intercomAttributes = {
      email: this.props.userEmail,
      name: this.props.userName,
      custom_attributes: {
        digitalmentor: "true"
      }
    };
    logger.info("Updating Intercom attributes", {
      ...intercomAttributes,
      ...userIdentifier
    });
    await this.props.intercom.updateUser(intercomAttributes);
  }

  async _askHelp() {
    await this._registerUser();
    await this.props.intercom.displayMessenger();
  }

  async componentDidMount() {
    await this.props.intercom.registerForPush();
  }

  render() {
    return (
      <View style={styles.reportAProblem}>
        <Image
          source={Images.Problem}
          style={{
            height: Metrics.images.xlarge,
            width: Metrics.images.xlarge
          }}
          resizeMode="contain"
        />
        <Button
          testID="askHelp"
          title="Report a problem"
          type="outline"
          onPress={async () => {
            await this._askHelp();
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  reportAProblem: {
    alignItems: "center"
  }
});

export default ReportAProblem;

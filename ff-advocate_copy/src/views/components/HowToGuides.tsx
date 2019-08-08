import React, { Component } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import ApplicationStyles from "../styles/ApplicationStyles";
import KeepAwake from "react-native-keep-awake";
import Loader from "./Loader";
import Config from "react-native-config";

interface Props {}

interface State {
  showLoader: boolean;
}

class HowToGuides extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showLoader: true
    };
  }

  render() {
    return (
      <View style={ApplicationStyles.mainContainer}>
        {this.state.showLoader && <Loader />}
        <WebView
          source={{
            uri: Config.HOW_TO_GUIDES_URL
          }}
          onLoadEnd={() => {
            this.setState({ showLoader: false });
          }}
        />
        <KeepAwake />
      </View>
    );
  }
}

export default HowToGuides;

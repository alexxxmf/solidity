import React, { Component, RefObject } from "react";
import {
  Linking,
  View,
  NavState,
  WebViewMessageEventData,
  NativeSyntheticEvent
} from "react-native";
import { WebView } from "react-native-webview";
import { withNavigation, NavigationInjectedProps } from "react-navigation";
import ApplicationStyles from "./styles/ApplicationStyles";
import isJson from "../utils/is-json";
import Loader from "./components/Loader";
import { logger } from "../utils/logging";
import { CompletedProfileAppScreenProps } from "../types";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import KeepAwake from "react-native-keep-awake";
import {
  onDeliveredSessionActivity,
  onEndAdaptCourse,
  onStartAdaptCourse
} from "./AnalyticsProvider";
import { FeedbackScreenParams } from "./FeedbackScreen";
import UUIDGenerator from "react-native-uuid-generator";
import { navigateToFeedbackScreen } from "../navigation/HomeNavigation";

const ADAPT_CONTENT_URL = "content.freeformers.com";

const injectedJavaScript = `
  (function() {
    window.postMessage = function(data) {
      window.ReactNativeWebView.postMessage(data);
    };
  })();
`;

export interface UrlWebviewScreenParams {
  uri: string;
  sessionContentId: string;
  sessionGlobalId: string;
  session: string;
  advocateMode: "Deliver" | "Prepare";
  deliveryLocation: string | null;
  componentTitle: string;
  configName: string;
  participantsCount: number | null;
  prepareDelivery: boolean | null;
}

type PropsNoContext = {
  screenProps: CompletedProfileAppScreenProps;
  advocateMode: "Deliver" | "Prepare";
} & NavigationInjectedProps<UrlWebviewScreenParams>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

interface State {
  uri: string;
  showLoader: boolean;
  topicTitle: string;
  sessionContentId: string;
  sessionGlobalId: string;
  sessionStart: Date;
  advocateMode: "Deliver" | "Prepare";
  deliveryLocation: string | null;
  componentTitle: string;
  configName: string;
  adaptActivityId: string;
  participantsCount: number | null;
  prepareDelivery: boolean | null;
  isClosingView: boolean;
}

class UrlWebviewScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { navigation } = this.props;

    this.state = {
      uri: navigation.getParam("uri"),
      sessionContentId: navigation.getParam("sessionContentId"),
      sessionGlobalId: navigation.getParam("sessionGlobalId"),
      showLoader: true,
      topicTitle: navigation.getParam("session"),
      sessionStart: new Date(),
      advocateMode: navigation.getParam("advocateMode"),
      deliveryLocation: navigation.getParam("deliveryLocation"),
      componentTitle: navigation.getParam("componentTitle"),
      configName: navigation.getParam("configName"),
      adaptActivityId: "",
      participantsCount: navigation.getParam("participantsCount"),
      prepareDelivery: navigation.getParam("prepareDelivery")
        ? navigation.getParam("prepareDelivery")
        : false,
      isClosingView: false
    };

    this.webview = React.createRef();

    logger.debug("Launching UrlWebviewScreen", { state: this.state });
  }

  _hideSpinner() {
    this.setState({ showLoader: false });
  }

  async componentDidMount() {
    /*
      HACK: handle returning to this screen once delivery has already been completed

      IMPORTANT NOTE: This will protect us from the case when you navigate through content session,
      finish it, reload it, and then going back to urlwebview and navigating again once pending
      participansList is cleared
    */
    if (this.props.screenProps.loadingLocalData && !undefined) {
      logger.info("Automatically navigating back to the registration screen");
      this.props.navigation.navigate("ParticipantsRegisterScreen");
    } else {
      const uuid = await UUIDGenerator.getRandomUUID();
      this.setState({ adaptActivityId: uuid });
      onStartAdaptCourse(this.props.context, this.state.sessionGlobalId, {
        uri: this.state.uri,
        advocateMode: this.state.advocateMode,
        componentTitle: this.state.componentTitle,
        sessionStart: this.state.sessionStart,
        deliveryLocation: this.state.deliveryLocation,
        topicUniqueId: this.state.sessionGlobalId,
        topicContentId: this.state.sessionContentId,
        configName: this.state.configName,
        topicTitle: this.state.topicTitle,
        adaptActivityId: uuid,
        participantsCount: this.state.participantsCount
      });
    }
  }

  _doesContainExtUrlsAndPdfs = (linkUrl: string) => {
    const splitedUrl = linkUrl.split("/");
    const urlFiltered = splitedUrl.filter(str => {
      return str.includes(ADAPT_CONTENT_URL);
    });
    const pdfFiltered = splitedUrl.filter(str => {
      return str.includes("pdf");
    });

    const res = urlFiltered[0] !== ADAPT_CONTENT_URL || pdfFiltered.length;

    logger.debug("Checking for external and PDF links", {
      linkUrl,
      result: res,
      ADAPT_CONTENT_URL
    });

    return res;
  };

  async _closeAdaptWebview() {
    const { topicTitle, sessionStart } = this.state;
    const {
      onCompletedSessionDelivery,
      onCompletedSessionPrepare,
      userId,
      userEmail,
      brandingTitle,
      userName
    } = this.props.screenProps;

    const sessionEnd = new Date();
    const activityData = {
      uri: this.state.uri,
      advocateMode: this.state.advocateMode,
      sessionEnd,
      componentTitle: this.state.componentTitle,
      sessionStart: this.state.sessionStart,
      topicUniqueId: this.state.sessionGlobalId,
      topicContentId: this.state.sessionContentId,
      configName: this.state.configName,
      topicTitle: this.state.topicTitle,
      deliveryLocation: this.state.deliveryLocation,
      adaptActivityId: this.state.adaptActivityId,
      participantsCount: this.state.participantsCount
    };

    logger.debug("Closing Adapt Webview", activityData);
    this.setState({ isClosingView: true });

    if (this.state.advocateMode === "Deliver") {
      await onCompletedSessionDelivery({
        ...activityData,
        userId,
        userEmail,
        userName,
        brandingTitle
      });

      onDeliveredSessionActivity(
        this.props.context,
        this.state.sessionGlobalId,
        activityData
      );

      onEndAdaptCourse(
        this.props.context,
        this.state.sessionGlobalId,
        activityData
      );
      const params: FeedbackScreenParams = {
        sessionContentId: this.state.sessionContentId,
        sessionGlobalId: this.state.sessionGlobalId,
        topicTitle: this.state.topicTitle,
        configName: this.state.configName,
        uri: this.state.uri,
        sessionEnd,
        componentTitle: this.state.componentTitle,
        sessionStart: this.state.sessionStart,
        deliveryLocation: this.state.deliveryLocation,
        adaptActivityId: this.state.adaptActivityId,
        participantsCount: this.state.participantsCount
      };

      await navigateToFeedbackScreen(this.props.navigation, params);
    } else if (this.state.advocateMode === "Prepare") {
      await onCompletedSessionPrepare(
        userId,
        userEmail,
        topicTitle,
        sessionStart
      );
      onEndAdaptCourse(
        this.props.context,
        this.state.sessionGlobalId,
        activityData
      );

      // Note: params are not required here. We're going back to a route that's already in the stack.
      this.state.prepareDelivery
        ? this.props.navigation.navigate("DeliverSessions")
        : this.props.navigation.navigate("SessionDetailsScreen");
    }
  }

  onShouldStartLoadWithRequest = (navData: NavState) => {
    if (!navData.url) {
      return true;
    }
    const url = navData.url;
    if (this._doesContainExtUrlsAndPdfs(url) && this.webview.current) {
      if (navData.url.includes("player.vimeo")) {
        return true;
      }
      setImmediate(async () => {
        await Linking.openURL(url);
      });
      return false;
    }
    // IOS produces more calls to this one so take extra care with
    // logic placed here
    return true;
  };

  _onMessage = async (event: string) => {
    if (this.state.isClosingView) {
      return;
    }

    if (isJson(event)) {
      const message = JSON.parse(event);
      if (message.completed) {
        await this._closeAdaptWebview();
      }
    } else if (event === "Adapt.onNextPageClick") {
      // Once things change on the adapt side, we might possibly need to add something
      // like Adapt.onPrevPageClick
      return;
    } else {
      logger.error(`[_onMessage error]: Unrecognized post message format`);
    }
  };

  _onMessageEventData = (
    event: NativeSyntheticEvent<WebViewMessageEventData>
  ) => {
    return this._onMessage(event.nativeEvent.data);
  };

  _fetchResponse = async (uri: string) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        logger.error(`Broken URL ${response.status} ${uri}`);
      }
    } catch (error) {
      logger.error(`Webview fetchResponse error ${error}`);
      console.error(error);
    }
  };

  private webview: RefObject<WebView>;

  render() {
    let { showLoader, uri } = this.state;
    return (
      <View style={ApplicationStyles.mainContainer}>
        {showLoader && <Loader />}
        <WebView
          javaScriptEnabled={true}
          ref={this.webview}
          onLoad={() => this._hideSpinner()}
          source={{ uri: uri }}
          allowsBackForwardNavigationGestures={true}
          onMessage={this._onMessageEventData}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={async () => {
            await this._fetchResponse(uri);
          }}
        />
        <KeepAwake />
      </View>
    );
  }
}

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context => context && <UrlWebviewScreen {...props} context={context} />}
  </AnalyticsContext.Consumer>
));

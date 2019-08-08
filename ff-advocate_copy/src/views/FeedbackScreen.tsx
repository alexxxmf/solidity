import React, { Component, RefObject } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleProp,
  TextStyle,
  Keyboard,
  EmitterSubscription
} from "react-native";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import { Metrics } from "../themes";
import styled from "styled-components/native";
import ApplicationStyles from "./styles/ApplicationStyles";
import Button from "./components/Button";
import Mood from "./components/feedback/Mood";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import { CompletedProfileAppScreenProps } from "../types";
import {
  onUserFeedbackComplete,
  onUserFeedbackSkipped
} from "./AnalyticsProvider";
import { logger } from "../utils/logging";
import { feedbackQuestions } from "../config/feedbackQuestions";
import { MultilineInput } from "./styles/FormStyle";

export interface FeedbackScreenParams {
  topicTitle: string;
  sessionContentId: string;
  sessionGlobalId: string;
  configName: string;
  uri: string;
  componentTitle: string;
  sessionStart: Date;
  sessionEnd: Date;
  deliveryLocation: string | null;
  adaptActivityId: string;
  participantsCount: number | null;
}

type PropsNoContext = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<FeedbackScreenParams>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

interface State {
  sessionContentId: string;
  sessionGlobalId: string;
  topicTitle: string;
  configName: string;
  uri: string;
  componentTitle: string;
  sessionStart: Date;
  sessionEnd: Date;
  deliveryLocation: string | null;
  adaptActivityId: string;
  participantsCount: number | null;
  answer: string;
  questionPicked: string;
}

class FeedbackScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { navigation } = this.props;
    this.state = {
      sessionContentId: navigation.getParam("sessionContentId"),
      sessionGlobalId: navigation.getParam("sessionGlobalId"),
      topicTitle: navigation.getParam("topicTitle"),
      configName: navigation.getParam("configName"),
      uri: navigation.getParam("uri"),
      componentTitle: navigation.getParam("componentTitle"),
      sessionStart: navigation.getParam("sessionStart"),
      sessionEnd: navigation.getParam("sessionEnd"),
      deliveryLocation: navigation.getParam("deliveryLocation"),
      adaptActivityId: navigation.getParam("adaptActivityId"),
      participantsCount: navigation.getParam("participantsCount"),
      answer: "",
      questionPicked: ""
    };

    this.moodRef = React.createRef();
    this.scrollViewRef = React.createRef();
    logger.debug("Loaded FeedbackScreen", { state: this.state });
  }

  private moodRef: RefObject<Mood>;
  private scrollViewRef: RefObject<ScrollView>;
  private keyboardSub: EmitterSubscription | null = null;

  pickRandomQuestion = (): string => {
    const pickedIndex = Math.floor(Math.random() * feedbackQuestions.length);
    return feedbackQuestions[pickedIndex];
  };

  componentDidMount = () => {
    this.setState({ questionPicked: this.pickRandomQuestion() });

    this.keyboardSub = Keyboard.addListener("keyboardWillShow", () => {
      if (this.scrollViewRef && this.scrollViewRef.current) {
        this.scrollViewRef.current.scrollToEnd({ animated: true });
      }
    });
  };

  componentWillUnmount() {
    if (this.keyboardSub) {
      this.keyboardSub.remove();
    }
  }

  skippedFeedback = () => {
    onUserFeedbackSkipped(this.props.context, this.state.sessionGlobalId, {
      adaptActivityId: this.state.adaptActivityId,
      topicUniqueId: this.state.sessionGlobalId,
      topicContentId: this.state.sessionContentId,
      topicTitle: this.state.topicTitle,
      configName: this.state.configName,
      uri: this.state.uri,
      advocateMode: "Deliver",
      componentTitle: this.state.componentTitle,
      sessionStart: this.state.sessionStart,
      sessionEnd: this.state.sessionEnd,
      deliveryLocation: this.state.deliveryLocation,
      participantsCount: this.state.participantsCount
    });
    this.props.navigation.navigate("DeliverSessions");
  };

  providedFeedback = (feedbackValue: number) => {
    onUserFeedbackComplete(this.props.context, this.state.sessionGlobalId, {
      question: this.state.questionPicked,
      answer: this.state.answer,
      adaptActivityId: this.state.adaptActivityId,
      topicUniqueId: this.state.sessionGlobalId,
      topicContentId: this.state.sessionContentId,
      topicTitle: this.state.topicTitle,
      configName: this.state.configName,
      uri: this.state.uri,
      advocateMode: "Deliver",
      componentTitle: this.state.componentTitle,
      sessionStart: this.state.sessionStart,
      sessionEnd: this.state.sessionEnd,
      deliveryLocation: this.state.deliveryLocation,
      feedbackValue,
      participantsCount: this.state.participantsCount
    });

    this.props.navigation.navigate("FeedbackThankYouScreen");
  };

  render() {
    return (
      <KeyboardContainer behavior="padding" enabled>
        <ScrollView
          style={ApplicationStyles.mainContainer}
          ref={this.scrollViewRef}
        >
          <View style={ApplicationStyles.sectionContainer}>
            <Text
              style={ApplicationStyles.sectionTitle as StyleProp<TextStyle>}
            >
              Congratulations
            </Text>
            <Text style={ApplicationStyles.sectionDescription}>
              How do you feel after the session?
            </Text>
            <Mood ref={this.moodRef} />

            <Text style={ApplicationStyles.sectionDescription}>
              {this.state.questionPicked}
            </Text>

            <MultilineInput
              multiline={true}
              onChangeText={(answer: string) => {
                this.setState({ answer });
              }}
              value={this.state.answer}
              placeholder="Share your thoughts here..."
            />

            <CallToActionContainer>
              <Button
                title="Skip"
                type="outline"
                style={{ width: Metrics.screenWidth < 360 ? 145 : 160 }}
                onPress={this.skippedFeedback}
              />
              <Button
                title="Send"
                type="solid"
                style={{ width: Metrics.screenWidth < 360 ? 145 : 160 }}
                onPress={() => {
                  const feedbackValue =
                    this.moodRef.current && this.moodRef.current.state.feedback;
                  if (feedbackValue) {
                    this.providedFeedback(feedbackValue);
                  } else {
                    this.skippedFeedback();
                  }
                }}
              />
            </CallToActionContainer>
          </View>
        </ScrollView>
      </KeyboardContainer>
    );
  }
}

const KeyboardContainer = styled.KeyboardAvoidingView`
  flex: 1;
`;

const CallToActionContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${Metrics.doubleBaseMargin}px;
  margin-bottom: ${Metrics.doubleBaseMargin}px;
`;

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context => context && <FeedbackScreen {...props} context={context} />}
  </AnalyticsContext.Consumer>
));

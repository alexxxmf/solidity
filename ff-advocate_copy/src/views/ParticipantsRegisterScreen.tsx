import React, { Component } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StyleProp,
  TextStyle
} from "react-native";
import {
  NavigationInjectedProps,
  Omit,
  withNavigation
} from "react-navigation";
import { Formik } from "formik";
import { Colors, Metrics } from "../themes";
import ApplicationStyles from "./styles/ApplicationStyles";
import Button from "./components/Button";
import { Button as NormalButton } from "react-native-elements";
import Loader from "./components/Loader";
import { Picker } from "react-native-wheel-pick";
import { AppScreenProps, DeliveryMetadata } from "../types";
import { ErrorText } from "./styles/FormStyle";
import { FocusTextInput } from "./components/FocusTextInput";
import * as Yup from "yup";
import { logger } from "../utils/logging";
import { UrlWebviewScreenParams } from "./UrlWebviewScreen";
import { navigateToUrlWebviewScreen } from "../navigation/HomeNavigation";
import * as Fonts from "../themes/Fonts";
import ButtonStyles from "./styles/ButtonStyles";

const detailSchema = Yup.object().shape({
  deliveryLocation: Yup.string().required("This field is required"),
  participantsNumber: Yup.number().min(1, "This field is required")
});

const participantOnlySchema = Yup.object().shape({
  participantsNumber: Yup.number().min(1, "This field is required")
});

export type ParticipantsRegisterScreenParams = Omit<
  UrlWebviewScreenParams,
  "deliveryLocation"
>;

type Props = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<ParticipantsRegisterScreenParams>;

interface State {
  session: string;
  uri: string;
  participantsNumberMax: number;
  sessionContentId: string;
  sessionGlobalId: string;
  deliveryLocation: string | null;
}

function isDeliveryMetadataLocationPresent(
  deliveryMetadata: DeliveryMetadata | {}
): deliveryMetadata is DeliveryMetadata {
  return (deliveryMetadata as DeliveryMetadata).location !== undefined;
}

class ParticipantsRegisterScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const session = this.props.navigation.getParam("session");
    const sessionContentId = this.props.navigation.getParam("sessionContentId");
    const sessionGlobalId = this.props.navigation.getParam("sessionGlobalId");
    const uri = this.props.navigation.getParam("uri");

    this.state = {
      session,
      uri,
      participantsNumberMax: 30,
      sessionContentId,
      sessionGlobalId,
      deliveryLocation: null
    };

    logger.debug("Loaded ParticipantsRegisterScreen", { state: this.state });
  }

  _createParticipantCounterValuesList = () => {
    const list: number[] = [];
    for (let i = 0; i <= this.state.participantsNumberMax; i++) {
      list.push(i);
    }
    return list;
  };

  _handleSubmitForm = async (values: {
    deliveryLocation: string;
    participantsNumber: number;
  }) => {
    const session = this.state.session;
    if (!session) {
      logger.warn(`No session data in ParticipantsRegisterScreen`);
      return;
    }

    const { deliveryLocation, participantsNumber } = values;

    if (deliveryLocation) {
      this.props.screenProps.setSessionDeliveryLocation(deliveryLocation);
    }

    this.props.screenProps.setSessionAndParticipantsCount(
      session,
      participantsNumber
    );

    const params: UrlWebviewScreenParams = {
      uri: this.state.uri,
      session: session,
      sessionContentId: this.state.sessionContentId,
      sessionGlobalId: this.state.sessionGlobalId,
      deliveryLocation: deliveryLocation ? deliveryLocation : null,
      advocateMode: this.props.navigation.getParam("advocateMode"),
      componentTitle: this.props.navigation.getParam("componentTitle"),
      configName: this.props.navigation.getParam("configName"),
      participantsCount: participantsNumber,
      prepareDelivery: null
    };

    logger.info("Launching Adapt Course", params);

    navigateToUrlWebviewScreen(this.props.navigation, params);
  };

  _handlePracticeSubmit = () => {
    const params: UrlWebviewScreenParams = {
      uri: this.state.uri,
      session: this.state.session,
      sessionContentId: this.state.sessionContentId,
      sessionGlobalId: this.state.sessionGlobalId,
      deliveryLocation: null,
      advocateMode: "Prepare",
      componentTitle: this.props.navigation.getParam("componentTitle"),
      configName: this.props.navigation.getParam("configName"),
      participantsCount: null,
      prepareDelivery: true
    };

    logger.info("Launching Adapt Course - just practicing", params);

    navigateToUrlWebviewScreen(this.props.navigation, params);
  };

  _getInitialValue = () => {
    const deliveryLocation = this.props.screenProps.deliveryLocation;
    const initialValue = deliveryLocation ? deliveryLocation : "";
    return initialValue;
  };

  render() {
    const deliveryMetadata = this.props.screenProps.deliveryMetadata;

    const location =
      deliveryMetadata && isDeliveryMetadataLocationPresent(deliveryMetadata)
        ? deliveryMetadata.location
        : null;

    if (this.props.screenProps.loadingLocalData) {
      return <Loader />;
    }

    return (
      <View style={ApplicationStyles.mainContainer}>
        <ScrollView>
          <View style={ApplicationStyles.sectionContainer}>
            <Text
              style={ApplicationStyles.sectionTitle as StyleProp<TextStyle>}
            >
              Tell us about the session...
            </Text>

            <Formik
              initialValues={{
                deliveryLocation: this._getInitialValue(),
                participantsNumber: 0
              }}
              onSubmit={this._handleSubmitForm}
              validationSchema={
                location && location.required
                  ? detailSchema
                  : participantOnlySchema
              }
              render={({
                handleSubmit,
                values,
                errors,
                handleChange,
                setFieldValue
              }) => {
                return (
                  <View>
                    {location ? (
                      <>
                        <Text style={ApplicationStyles.sectionSubTitle}>
                          Where are you?
                        </Text>
                        <FocusTextInput
                          keyboardType={
                            location.format === "numeric"
                              ? "numeric"
                              : "default"
                          }
                          placeholder={location.label}
                          placeholderTextColor={Colors.textGray}
                          value={values.deliveryLocation}
                          onChangeText={handleChange("deliveryLocation")}
                          style={styles.deliveryMetadataInput}
                        />

                        {errors.deliveryLocation ? (
                          <ErrorText error>{errors.deliveryLocation}</ErrorText>
                        ) : null}
                      </>
                    ) : null}
                    <View>
                      <Text style={ApplicationStyles.sectionSubTitle}>
                        Number of participants in the room?
                      </Text>
                      <View style={styles.participantCountCard}>
                        <Picker
                          style={styles.participantCountWheel}
                          selectedValue={values.participantsNumber}
                          pickerData={this._createParticipantCounterValuesList()}
                          onValueChange={(value: number) =>
                            setFieldValue("participantsNumber", value, false)
                          }
                          itemSpace={this.state.participantsNumberMax}
                        />
                        {errors.participantsNumber ? (
                          <ErrorText error>
                            {errors.participantsNumber}
                          </ErrorText>
                        ) : null}
                      </View>
                    </View>

                    <Button
                      title="Ready to deliver"
                      type="solid"
                      onPress={handleSubmit}
                    />
                  </View>
                );
              }}
            />
          </View>
          <View style={styles.prepareDelivery}>
            <View style={styles.orContainer}>
              <View style={styles.textBorder} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.textBorder} />
            </View>
            <NormalButton
              title="I'm just practicing"
              type="solid"
              onPress={this._handlePracticeSubmit}
              buttonStyle={{
                ...ButtonStyles.base,
                ...ButtonStyles.solidRed
              }}
              disabledStyle={{
                ...ButtonStyles.base,
                ...ButtonStyles.solidRed,
                ...ButtonStyles.disabled
              }}
              titleStyle={{
                ...ButtonStyles.solidTitle
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  participantCountCard: {
    alignItems: "center"
  },
  participantCountWheel: {
    backgroundColor: Colors.background,
    width: 300
  },
  deliveryMetadataInput: {
    color: Colors.black
  },
  orText: {
    ...Fonts.style.normal,
    paddingHorizontal: Metrics.baseMargin,
    color: Colors.gray
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Metrics.tripleBaseMargin,
    marginBottom: Metrics.tripleBaseMargin
  },
  textBorder: {
    flex: 1,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1
  },
  prepareDelivery: {
    paddingHorizontal: Metrics.baseMargin,
    marginBottom: Metrics.baseMargin
  }
});

export default withNavigation(ParticipantsRegisterScreen);

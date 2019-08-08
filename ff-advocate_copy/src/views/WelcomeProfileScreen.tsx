import React, { Component } from "react";
import { Text, View, StyleSheet, StyleProp, TextStyle } from "react-native";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import Button from "./components/Button";
import styled from "styled-components/native";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import {
  Label,
  LabelOption,
  ErrorText,
  KeyboardContainer
} from "./styles/FormStyle";
import { Colors, Metrics, Fonts } from "../themes";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import { Formik, FormikActions } from "formik";
import * as Yup from "yup";
import { CompletedProfileAppScreenProps } from "../types";
import { FocusTextInput } from "./components/FocusTextInput";
import { UserNameField } from "./components/profile/UpdateDetails";
import { useProgrammeCode } from "./ManageProgrammeMembership";
import { logger } from "../utils/logging";
import { storeUserName } from "../utils/profile";
import { onboardingClient } from "../graphql/client";
import AsyncStorage from "@react-native-community/async-storage";

const detailSchema = Yup.object().shape({
  userName: Yup.string().required("You need to provide your full name."),
  programmeCode: Yup.string()
    .min(6, "Programme code should be at least six digits")
    .matches(/\d{6,}/, "Programme code should be at least six digits")
});

type PropsNoContext = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<{}>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

interface State {}

export class WelcomeProfileScreen extends Component<Props, State> {
  _checkProgrammeCode = async (userEmail: string, programmeCode: string) => {
    const userOptions = await useProgrammeCode(userEmail, programmeCode);

    if (!userOptions) {
      logger.warn(
        `No userOptions [useProgrammeCode WelcomeProfileScreen],
        email: ${userEmail}, programmeCode: ${programmeCode}`
      );
      return false;
    }

    await this.props.screenProps.updateUserOptions(userOptions);
    logger.info(`[updateUserOptions] completed`, userOptions);
    return true;
  };

  _handleSubmit = async (
    values: {
      userName: string;
      programmeCode: undefined | string;
    },
    formikActions: FormikActions<{
      userName: string;
      programmeCode: undefined | string;
    }>
  ) => {
    const userEmail = this.props.screenProps.userEmail;
    const { setStatus, setSubmitting } = formikActions;
    let { userName, programmeCode } = values;

    let stored = true;
    setStatus({});

    if (programmeCode) {
      const usedProgrammeCode = await this._checkProgrammeCode(
        userEmail,
        programmeCode
      );
      if (!usedProgrammeCode) {
        logger.debug("Wrong programme code used", programmeCode);
        setStatus({ wrongSecretCode: programmeCode });
      }
      stored = stored && usedProgrammeCode;
    }

    const updatedUserName = await storeUserName(
      this.props.screenProps.updateUserOptions,
      onboardingClient,
      AsyncStorage,
      userEmail,
      userName
    );
    stored = stored && updatedUserName;

    if (!updatedUserName) {
      logger.warn(`[updatedUserName] failed with ${userEmail} ${userName}`);
      setStatus({ unexpectedUserError: true });
    }

    if (!stored) {
      setSubmitting(false);
      return;
    }

    this.props.navigation.navigate("WelcomeScreen");
  };

  render() {
    return (
      <ScrollContainer keyboardDismissMode="on-drag">
        <KeyboardContainer behavior="padding" enabled>
          <CenteredContent>
            <FaIcon
              name="user-circle"
              size={Metrics.icons.large}
              style={styles.emailIcon}
              solid
            />
            <Text style={styles.title as StyleProp<TextStyle>}>
              Let’s get to know you
            </Text>
            <Text style={styles.indications}>Personalise your experience</Text>
          </CenteredContent>
          <Formik
            initialValues={{
              programmeCode: "",
              userName: this.props.screenProps.userName || ""
            }}
            isInitialValid
            onSubmit={this._handleSubmit}
            validationSchema={detailSchema}
            render={({
              handleSubmit,
              values,
              errors,
              isSubmitting,
              handleChange,
              handleBlur,
              status
            }) => {
              return (
                <>
                  <UserNameField
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    errors={errors}
                  />
                  <View>
                    <Label>Programme code</Label>
                    <LabelOption> (Optional)</LabelOption>
                  </View>
                  <FocusTextInput
                    keyboardType="phone-pad"
                    placeholder="123456"
                    placeholderTextColor={Colors.textGray}
                    value={values.programmeCode}
                    onChangeText={handleChange("programmeCode")}
                    onBlur={handleBlur("programmeCode")}
                  />

                  {errors.programmeCode ? (
                    <ErrorText>{errors.programmeCode}</ErrorText>
                  ) : null}

                  {status && status.wrongSecretCode ? (
                    <View>
                      <ErrorText>
                        {`Unknown Code "${
                          status.wrongSecretCode
                        }" - this field is optional.`}
                      </ErrorText>
                    </View>
                  ) : null}

                  {status && status.unexpectedUserError ? (
                    <View>
                      <ErrorText>
                        Unexpected error saving data. Please try again.
                      </ErrorText>
                    </View>
                  ) : null}

                  <Button
                    disabled={isSubmitting}
                    title="Save details"
                    onPress={handleSubmit}
                  />
                </>
              );
            }}
          />
        </KeyboardContainer>
      </ScrollContainer>
    );
  }
}

const ScrollContainer = styled.ScrollView`
  flex: 1;
  background-color: ${Colors.primary};
`;

const CenteredContent = styled.View`
  align-items: center;
`;

const styles = StyleSheet.create({
  emailIcon: {
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin
  },
  title: {
    ...Fonts.style.sectionHeaderLarge,
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin
  },
  indications: {
    ...Fonts.style.sectionHeaderSmall,
    lineHeight: Fonts.size.large + 5,
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin
  }
});

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context =>
      context && <WelcomeProfileScreen {...props} context={context} />
    }
  </AnalyticsContext.Consumer>
));

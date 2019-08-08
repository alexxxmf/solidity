import React, { Component } from "react";
import {
  StyleSheet,
  Image,
  View,
  Text,
  KeyboardAvoidingView,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import Button from "./components/Button";
import {
  NavigationInjectedProps,
  withNavigation,
  NavigationParams
} from "react-navigation";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { Images, Colors, Fonts, Metrics } from "../themes";
import { Label, ErrorText } from "./styles/FormStyle";
import styled from "styled-components/native";
import { onboardingClient } from "../graphql/client";
import {
  CREATE_EMAIL_TOKEN_MUTATION,
  CreateEmailTokenResult,
  CreateEmailTokenVars
} from "../graphql/auth/mutations";
import { logger } from "../utils/logging";
import { storageKeys } from "../config/storageKeys";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import { Formik } from "formik";
import * as Yup from "yup";
import { AppScreenProps } from "../types";
import { FocusTextInput } from "./components/FocusTextInput";
import { onLoginEmailSent } from "./AnalyticsProvider";

type PropsNoContext = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<NavigationParams>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

interface State {
  error: string | null;
}

const SignupSchema = Yup.object().shape({
  userEmail: Yup.string()
    .email("Your email is invalid")
    .required("Email required")
});

class OnBoardingSignInScreen extends Component<Props, State> {
  _storeUserData = async (cleanedEmail: string) => {
    try {
      await AsyncStorage.setItem(storageKeys.USER_EMAIL, cleanedEmail);
      await this.props.screenProps.setUserEmail(cleanedEmail);
      logger.info(`storeUserData completed`, cleanedEmail);
    } catch (error) {
      logger.error(`[storeUserData error]: ${error}`);
      this.setState({ error: "Something went wrong" });
    }
  };

  _handleSubmit = async (values: { userEmail: string }) => {
    const { userEmail } = values;

    if (userEmail !== "") {
      const variables = { email: userEmail };

      const response = await onboardingClient.mutate<
        CreateEmailTokenResult,
        CreateEmailTokenVars
      >({
        mutation: CREATE_EMAIL_TOKEN_MUTATION,
        variables: variables,
        fetchPolicy: "no-cache"
      });

      if (!response.data) {
        logger.warn(`CREATE_EMAIL_TOKEN_MUTATION failed with ${variables}`);
        return;
      }

      if (response.data.sendLoginReminder.sent) {
        const cleanedEmail = response.data.sendLoginReminder.email;

        await this._storeUserData(cleanedEmail);

        onLoginEmailSent(this.props.context, cleanedEmail);
        this.props.navigation.navigate("OnboardingPendingScreen");
      }
      return;
    }
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior="padding">
        <BackIntroButton
          onPress={() => this.props.navigation.navigate("OnboardingScreen")}
        >
          <FaIcon
            name="arrow-left"
            size={Metrics.icons.medium}
            style={{ color: Colors.white }}
            solid
          />
        </BackIntroButton>
        <View style={styles.formContainer}>
          <Image
            source={Images.logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.indications}>
            Enter your email to receive a sign up link
          </Text>

          <Formik
            initialValues={{ userEmail: "" }}
            onSubmit={this._handleSubmit}
            validationSchema={SignupSchema}
            render={({
              handleSubmit,
              values,
              errors,
              isSubmitting,
              isValid,
              handleChange,
              handleBlur
            }) => {
              return (
                <>
                  <Label>Email</Label>
                  <FocusTextInput
                    autoCorrect={false}
                    keyboardType="email-address"
                    testID="userEmailOnboarding"
                    autoCapitalize="none"
                    placeholder="yourname@example.com"
                    placeholderTextColor={Colors.transparentWhite}
                    value={values.userEmail}
                    onChangeText={handleChange("userEmail")}
                    onBlur={handleBlur("userEmail")}
                  />
                  <ErrorText style={{ textAlign: "center" }}>
                    {errors.userEmail ? errors.userEmail : null}
                  </ErrorText>
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} size="large" />
                  ) : (
                    <Button
                      disabled={!isValid}
                      testID="goToPending"
                      title="Send me my link"
                      onPress={handleSubmit}
                    />
                  )}
                </>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }
}

export const BackIntroButton = styled.TouchableOpacity`
  position: absolute;
  top: ${Metrics.navBarHeight};
  left: ${Metrics.doubleBaseMargin};
  padding: ${Metrics.baseMargin}px;
`;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Metrics.doubleBaseMargin * 2
  },
  formContainer: {
    flex: 1,
    maxWidth: 300,
    margin: "auto"
  },
  logoImage: {
    alignSelf: "center",
    height: Metrics.images.xlarge,
    width: Metrics.images.xlarge
  },
  indications: {
    ...Fonts.style.sectionHeaderSmall,
    color: Colors.white,
    marginBottom: Metrics.doubleBaseMargin,
    textAlign: "center"
  }
});

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context =>
      context && <OnBoardingSignInScreen {...props} context={context} />
    }
  </AnalyticsContext.Consumer>
));

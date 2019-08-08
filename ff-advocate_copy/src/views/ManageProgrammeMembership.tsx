import React, { Component } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  ListRenderItem,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View
} from "react-native";
import { Colors, Fonts, Images, Metrics } from "../themes";
import {
  NavigationInjectedProps,
  NavigationParams,
  withNavigation
} from "react-navigation";
import ApplicationStyles from "./styles/ApplicationStyles";
import { AppScreenProps } from "../types";
import { Query } from "react-apollo";
import { onboardingClient } from "../graphql/client";
import {
  LIST_USER_PROGRAMMES,
  ListUserProgrammesItem,
  ListUserProgrammesResult,
  ListUserProgrammesVars
} from "../graphql/auth/queries";
import { ListItem } from "react-native-elements";
import CustomButton from "./components/Button";
import { Formik, FormikActions } from "formik";
import { ErrorText, Label, KeyboardContainer } from "./styles/FormStyle";
import { FocusTextInput } from "./components/FocusTextInput";
import * as Yup from "yup";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { CloseModal, ProfileModal } from "./components/profile/UpdateDetails";
import {
  CHECK_PROGRAMME_CODE_MUTATION,
  CheckProgrammeCodeResult,
  CheckProgrammeCodeVars
} from "../graphql/auth/mutations";
import { logger } from "../utils/logging";

const detailSchema = Yup.object().shape({
  programmeCode: Yup.string()
    .min(6, "Programme code should be at least six digits")
    .matches(/\d{6,}/, "Programme code should be at least six digits")
});

type Props = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<NavigationParams>;

interface State {
  changingProgramme: boolean;
  programmeCodeModalVisible: boolean;
}

export const useProgrammeCode = async (
  userEmail: string,
  programmeCode: string
) => {
  const response = await onboardingClient.mutate<
    CheckProgrammeCodeResult,
    CheckProgrammeCodeVars
  >({
    mutation: CHECK_PROGRAMME_CODE_MUTATION,
    variables: {
      userEmail: userEmail,
      programmeCode: programmeCode
    },
    fetchPolicy: "no-cache",
    refetchQueries: [
      {
        query: LIST_USER_PROGRAMMES,
        variables: {
          userEmail
        }
      }
    ]
  });

  if (!response.data || !response.data.checkProgrammeCode.valid) {
    logger.warn(
      `CHECK_PROGRAMME_CODE_MUTATION failed with ${userEmail} ${programmeCode}`
    );
    return null;
  }
  logger.info(
    `CHECK_PROGRAMME_CODE_MUTATION data returned
    ${response.data.checkProgrammeCode.userOptions}`
  );
  return response.data.checkProgrammeCode.userOptions;
};

const UseProgrammeCodeModal = ({
  modalVisible,
  setModalVisible,
  onSubmit
}: {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (
    values: { programmeCode: string },
    formikActions: FormikActions<{ programmeCode: string }>
  ) => void;
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}
    >
      <ProfileModal>
        <KeyboardContainer behavior="padding" enabled>
          <CloseModal
            onPress={() => {
              setModalVisible(!modalVisible);
            }}
          >
            <FaIcon
              name="times"
              size={Metrics.icons.medium}
              style={{ color: Colors.white }}
              solid
            />
          </CloseModal>

          <Formik
            initialValues={{
              programmeCode: ""
            }}
            isInitialValid
            onSubmit={onSubmit}
            validationSchema={detailSchema}
            render={({
              handleSubmit,
              values,
              errors,
              isSubmitting,
              isValid,
              handleChange,
              handleBlur,
              status
            }) => {
              return (
                <>
                  <View>
                    <Label>Programme Code</Label>
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
                  {status && status.incorrectProgrammeCode ? (
                    <ErrorText>
                      {`Sorry, ${
                        status.incorrectProgrammeCode
                      } is an unknown code. Please check and try again.`}
                    </ErrorText>
                  ) : null}
                  <CustomButton
                    disabled={isSubmitting || !isValid}
                    title="Use programme code"
                    onPress={handleSubmit}
                  />
                </>
              );
            }}
          />
        </KeyboardContainer>
      </ProfileModal>
    </Modal>
  );
};

class ManageProgrammeMembership extends Component<Props, State> {
  state = {
    changingProgramme: false,
    programmeCodeModalVisible: false
  };

  onStartChangeProgramme = (item: ListUserProgrammesItem) => {
    Alert.alert(
      "Change Programme",
      `Switch to "${item.brandingTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: () => {
            this.changeProgramme(item.programmeId);
          }
        }
      ],
      { cancelable: false }
    );
  };

  changeProgramme = (programmeId: number) => {
    this.setState({ changingProgramme: true }, () => {
      if (!this.props.screenProps.userEmail) {
        logger.warn(`[changeProgramme] error, no userName`);
        return;
      }
      this.props.screenProps.changeProgrammeById(
        this.props.screenProps.userEmail,
        programmeId,
        this.props.navigation
      );
    });
  };

  renderItem: ListRenderItem<ListUserProgrammesItem> = ({ item }) => {
    return (
      <ListItem
        title={item.brandingTitle}
        checkmark={item.currentProgramme}
        titleStyle={styles.listItemTitle}
        bottomDivider
        onPress={
          item.currentProgramme
            ? undefined
            : () => {
                this.onStartChangeProgramme(item);
              }
        }
      />
    );
  };

  render() {
    const loadingPlaceholder = (
      <>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text
          style={[
            ApplicationStyles.sectionDescription,
            { textAlign: "center" }
          ]}
        >
          Loading…
        </Text>
      </>
    );

    return (
      <>
        <UseProgrammeCodeModal
          modalVisible={
            !this.state.changingProgramme &&
            this.state.programmeCodeModalVisible
          }
          setModalVisible={this.setProgrammeCodeModalVisible}
          onSubmit={this.submitProgrammeCodeModal}
        />
        <View style={ApplicationStyles.mainContainer}>
          <ImageBackground
            source={Images.profileBg}
            style={ApplicationStyles.imageBackground}
          >
            <View
              style={[
                ApplicationStyles.sectionContainer,
                styles.titleContainer
              ]}
            >
              <Text style={ApplicationStyles.sectionTitle}>
                Your programmes
              </Text>
            </View>
            <View
              style={[
                ApplicationStyles.sectionContainer,
                styles.sectionContainer
              ]}
            >
              <CustomButton
                type="outline"
                title="Use a programme code"
                containerStyle={styles.buttonStyle}
                onPress={() => {
                  this.setProgrammeCodeModalVisible(true);
                }}
              />

              <View style={styles.listSubtitleWrapper}>
                <Text style={Fonts.style.listSubtitle as StyleProp<TextStyle>}>
                  Switch Programme
                </Text>
              </View>

              {this.state.changingProgramme ||
              !this.props.screenProps.userEmail ? (
                loadingPlaceholder
              ) : (
                <Query<ListUserProgrammesResult, ListUserProgrammesVars>
                  client={onboardingClient}
                  query={LIST_USER_PROGRAMMES}
                  variables={{
                    userEmail: this.props.screenProps.userEmail
                  }}
                >
                  {({ data, error, loading }) => {
                    if (error) {
                      throw error;
                    }

                    if (loading || !data) {
                      return loadingPlaceholder;
                    }
                    return (
                      <FlatList
                        keyExtractor={item => `${item.programmeId}`}
                        data={data.listUserProgrammes.programmes}
                        renderItem={this.renderItem}
                      />
                    );
                  }}
                </Query>
              )}
            </View>
          </ImageBackground>
        </View>
      </>
    );
  }

  setProgrammeCodeModalVisible = (visible: boolean) => {
    this.setState({ programmeCodeModalVisible: visible });
  };

  submitProgrammeCodeModal = async (
    values: { programmeCode: string },
    formikActions: FormikActions<{ programmeCode: string }>
  ) => {
    const { userEmail } = this.props.screenProps;
    const { programmeCode } = values;
    const { setStatus, setSubmitting } = formikActions;

    setStatus({});

    if (!programmeCode || !userEmail) {
      logger.warn(
        `[submitProgrammeCodeModal] no programmeCode or userEmail,
        programmeCode: ${programmeCode}, userEmail: ${userEmail}`
      );

      return;
    }

    const userOptions = await useProgrammeCode(userEmail, programmeCode);

    if (!userOptions) {
      setStatus({ incorrectProgrammeCode: programmeCode });
      setSubmitting(false);
      logger.warn(
        `[useProgrammeCode] no userOptions returned, ${programmeCode}`
      );
      return;
    }

    this.setState({ changingProgramme: true }, () => {
      setSubmitting(false);
      this.props.screenProps.changeProgrammeByOptions(
        userOptions,
        this.props.navigation
      );
    });
    logger.info(`Programme changed successfully`, userOptions);
  };
}

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 0
  },
  titleContainer: {
    flexDirection: "row"
  },
  listItemTitle: {
    fontFamily: Fonts.family.name
  },
  buttonStyle: { margin: Metrics.baseMargin },
  listSubtitleWrapper: {
    marginHorizontal: Metrics.marginHorizontal,
    marginBottom: Metrics.baseMargin,
    marginTop: Metrics.doubleBaseMargin
  }
});

export default withNavigation(ManageProgrammeMembership);

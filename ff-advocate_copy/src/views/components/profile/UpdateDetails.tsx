import React, { Component } from "react";
import {
  Modal,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  View
} from "react-native";
import { ErrorText, KeyboardContainer, Label } from "../../styles/FormStyle";
import styled from "styled-components/native";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { Colors, Metrics } from "../../../themes";
import Button from "../Button";
import { Formik } from "formik";
import * as Yup from "yup";
import { FocusTextInput } from "../FocusTextInput";
import { ProfileMenuItem } from "./ProfileMenuItem";

const detailSchema = Yup.object().shape({
  userName: Yup.string().required("You need to provide your full name.")
});

interface Props {
  userEmail: string;
  userName: string;
  onStoreUserName: (
    userEmail: string,
    userName: string,
    onUnexpectedError?: () => void
  ) => Promise<boolean>;
}

interface State {
  modalVisible: boolean;
  unexpectedError: boolean;
}

export const UserNameField = ({
  values,
  handleChange,
  handleBlur,
  errors
}: {
  values: { userName: string };
  handleBlur<T = string>(
    fieldOrEvent: T
  ): T extends string
    ? ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void)
    : void;
  handleChange<T = string>(
    field: T
  ): T extends React.ChangeEvent
    ? void
    : ((e: string | React.ChangeEvent) => void);
  errors: { userName?: string };
}) => (
  <View>
    <Label>Full name</Label>
    <FocusTextInput
      testID="usernameInput"
      placeholder="Benjamin Franklin"
      value={values.userName}
      placeholderTextColor={Colors.textGray}
      onChangeText={handleChange("userName")}
      onBlur={handleBlur("userName")}
    />
    {errors.userName ? <ErrorText>{errors.userName}</ErrorText> : null}
  </View>
);

export class UpdateDetails extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      modalVisible: false,
      unexpectedError: false
    };
  }

  _setModalVisible(visible: boolean) {
    this.setState({ modalVisible: visible });
  }

  _handleSubmit = async (values: { userName: string }) => {
    const userEmail = this.props.userEmail;
    const { userName } = values;

    const stored = await this.props.onStoreUserName(userEmail, userName, () => {
      this.setState({ unexpectedError: true });
    });

    if (stored) {
      this._setModalVisible(false);
    }
  };

  render() {
    return (
      <>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this._setModalVisible(false);
          }}
        >
          <ProfileModal>
            <KeyboardContainer behavior="padding" enabled>
              <CloseModal
                testID="closeModal"
                onPress={() => {
                  this._setModalVisible(!this.state.modalVisible);
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
                  userName: this.props.userName
                }}
                isInitialValid
                onSubmit={this._handleSubmit}
                validationSchema={detailSchema}
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
                      <UserNameField
                        values={values}
                        errors={errors}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                      />

                      {this.state.unexpectedError ? (
                        <ErrorText>
                          Something went wrong, please try again later.
                        </ErrorText>
                      ) : null}

                      <Button
                        testID="saveChanges"
                        disabled={isSubmitting || !isValid}
                        title="Save changes"
                        onPress={handleSubmit}
                      />
                    </>
                  );
                }}
              />
            </KeyboardContainer>
          </ProfileModal>
        </Modal>
        <ProfileMenuItem
          testID="updateName"
          onPress={() => {
            this._setModalVisible(true);
          }}
          label="Update your name"
        />
      </>
    );
  }
}

export const ProfileModal = styled.View`
  background-color: ${Colors.primary};
  flex: 1;
`;

export const CloseModal = styled.TouchableOpacity`
  position: absolute;
  top: ${Metrics.navBarHeight};
  right: ${Metrics.doubleBaseMargin};
  padding: ${Metrics.baseMargin}px;
`;

export default UpdateDetails;

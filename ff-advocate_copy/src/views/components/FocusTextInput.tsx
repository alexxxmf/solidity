import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData
} from "react-native";
import { Component } from "react";
import { Input } from "../styles/FormStyle";
import React from "react";

type FocusTextInputProps = TextInput["props"] & {
  initialIsFocused?: boolean;
};

interface FocusTextInputState {
  isFocused: boolean;
}

export class FocusTextInput extends Component<
  FocusTextInputProps,
  FocusTextInputState
> {
  state = {
    isFocused: !!this.props.initialIsFocused
  };

  setFocused = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    this.setState({ isFocused: true });
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  };

  setBlurred = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    this.setState({ isFocused: false });
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  };

  render() {
    return (
      <Input
        {...this.props}
        onFocus={this.setFocused}
        onBlur={this.setBlurred}
        isFocused={this.state.isFocused}
      />
    );
  }
}

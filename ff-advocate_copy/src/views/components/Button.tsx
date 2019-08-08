import React from "react";
import { Button, ButtonProps } from "react-native-elements";
import ButtonStyles from "../styles/ButtonStyles";
import { Omit } from "react-navigation";

interface Props
  extends Omit<
    ButtonProps,
    keyof {
      disabledStyle: unknown;
      buttonStyle: unknown;
      titleStyle: unknown;
    }
  > {
  type?: "solid" | "outline";
}

const CustomButton = ({ type = "solid", ...props }: Props) => {
  if (type === "outline") {
    return (
      <Button
        type="outline"
        {...props}
        buttonStyle={{
          ...ButtonStyles.base,
          ...ButtonStyles.outline
        }}
        disabledStyle={{
          ...ButtonStyles.base,
          ...ButtonStyles.outline,
          ...ButtonStyles.disabled
        }}
        titleStyle={{
          ...ButtonStyles.outlineTitle
        }}
      />
    );
  } else {
    return (
      <Button
        type="solid"
        {...props}
        buttonStyle={{
          ...ButtonStyles.base,
          ...ButtonStyles.solid
        }}
        disabledStyle={{
          ...ButtonStyles.base,
          ...ButtonStyles.solid,
          ...ButtonStyles.disabled
        }}
        titleStyle={{
          ...ButtonStyles.solidTitle
        }}
      />
    );
  }
};

export default CustomButton;

import styled from "styled-components/native";
import { Fonts, Metrics, Colors } from "../../themes";

export const Label = styled.Text`
  color: ${Colors.white};
  padding: 5px;
  font-weight: bold;
`;

export const LabelOption = styled.Text`
  color: ${Colors.white};
  position: absolute;
  right: 0;
  top: 5px;
`;

interface InputProps {
  isFocused?: boolean;
}

export const MultilineInput = styled.TextInput`
  min-height: 100;
  border-color: ${Colors.gray};
  border-width: 2px;
  padding: ${Metrics.baseMargin}px;
  color: ${Colors.black};
  margin-top: ${Metrics.baseMargin}px;
  border-radius: ${Metrics.buttonRadius}px;
  font-size: ${Fonts.size.medium};
  background: ${Colors.white};
  font-family: ${Fonts.family.name};
  border-color: ${(props: InputProps) =>
    props.isFocused ? Colors.highlightedBorder : Colors.border};
`;

export const Input = styled.TextInput`
  font-size: ${Fonts.size.medium}px;
  height: 60;
  border-width: 2px;
  min-width: 240;
  padding: ${Metrics.baseMargin}px;
  margin-bottom: ${Metrics.doubleBaseMargin}px;
  border-radius: ${Metrics.buttonRadius}px;
  border-color: ${(props: InputProps) =>
    props.isFocused ? Colors.highlightedBorder : Colors.border};
  color: ${Colors.white};
`;

interface ErrorTextProps {
  error?: boolean;
}

export const ErrorText = styled.Text`
  color: ${Colors.warning};
  color: ${(props: ErrorTextProps) =>
    props.error ? Colors.error : Colors.warning}
  font-weight: bold;
  font-size: ${Fonts.size.medium}px;
  min-height: ${Fonts.size.medium + Metrics.buttonBorder}px;
  margin-bottom: ${Metrics.doubleBaseMargin};
`;

export const KeyboardContainer = styled.KeyboardAvoidingView`
  padding-horizontal: ${Metrics.doubleBaseMargin};
  height: ${Metrics.screenHeight};
  justify-content: center;
`;

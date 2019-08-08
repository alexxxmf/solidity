import React from "react";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import ListStyle from "../../styles/ListStyle";
import styled from "styled-components/native";
import { Colors, Metrics, Fonts } from "../../../themes";
import { GestureResponderEvent, ViewProps } from "react-native";

type Props = {
  onPress: (event: GestureResponderEvent) => void;
  label: string;
} & ViewProps;

export const ProfileMenuItem = ({ onPress, label, ...props }: Props) => (
  <LinkContainer onPress={onPress} {...props}>
    <LinkText style={{ ...Fonts.style.description }}>{label}</LinkText>
    <FaIcon
      name="angle-right"
      size={Metrics.icons.small}
      style={ListStyle.nextIcon}
    />
  </LinkContainer>
);

const LinkText = styled.Text`
  color: ${Colors.grayDark};
  flex: 1;
`;

const LinkContainer = styled.TouchableOpacity`
  padding-vertical: ${Metrics.baseMargin}px;
  padding-horizontal: ${Metrics.smallMargin}px;
  flex-direction: row;
`;

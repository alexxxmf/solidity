import styled from "styled-components/native";
import { Metrics, Colors } from "../../themes";

interface CardProps {
  size?: number;
}

export const Card = styled.View`
  background-color: ${Colors.white};
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.border};
  margin-bottom: ${Metrics.baseMargin}px;
  border-radius: ${Metrics.buttonRadiusDouble}px;
  padding: ${(props: CardProps) => props.size || Metrics.baseMargin}px;
`;

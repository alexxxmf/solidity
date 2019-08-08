declare module "react-native-wheel-pick" {
  import { Component } from "react";
  import { StyleProp } from "react-native";

  interface Props<T> {
    style: StyleProp;
    selectedValue: T;
    onValueChange: (value: T) => void;
    itemSpace: T;
    pickerData: T[];
  }

  export class Picker extends Component<Props<number>> {}
}

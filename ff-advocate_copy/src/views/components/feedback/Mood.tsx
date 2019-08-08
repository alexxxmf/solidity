import React, { Component } from "react";
import { StyleSheet, View, Image } from "react-native";
import { Metrics } from "../../../themes";
import Illustration from "../../../images/feedback/mood-illustrations";
import Button from "../Button";

interface Props {}

interface State {
  feedback: null | number;
}

class FeedbackQuestion extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      feedback: null
    };
  }

  _onChangeFeedback = (val: number) => {
    this.setState({ feedback: val });
  };

  _renderButtons(moodDatas: { id: keyof typeof Illustration; text: string }[]) {
    return moodDatas.map((item, key) => {
      return (
        <View style={styles.column} key={key}>
          <Image
            source={Illustration[item.id]}
            style={styles.illustration}
            resizeMode="contain"
          />
          <Button
            title={item.text}
            onPress={() => {
              this._onChangeFeedback(item.id);
            }}
            type={this.state.feedback === item.id ? "solid" : "outline"}
          />
        </View>
      );
    });
  }

  render() {
    const moodDatas: { id: keyof typeof Illustration; text: string }[] = [
      {
        id: 1,
        text: "Bad"
      },
      {
        id: 2,
        text: "Okay"
      },
      {
        id: 3,
        text: "Good"
      },
      {
        id: 4,
        text: "Great"
      }
    ];

    return <View style={styles.row}>{this._renderButtons(moodDatas)}</View>;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Metrics.doubleBaseMargin
  },
  column: {
    justifyContent: "flex-end",
    alignItems: "center"
  },
  illustration: {
    height: 240,
    width: 70,
    marginBottom: Metrics.smallMargin
  }
});

export default FeedbackQuestion;

import React, { Component } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import { Colors, Metrics, Fonts } from "../../themes";

interface Props {}

interface State {
  timerSeconds: number;
  timerValue: string;
  timerRunning: boolean;
  interval: NodeJS.Timeout | null;
  dateStarted: Date | null;
}

const initialTimeWindow = 900;

class Timer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      timerSeconds: initialTimeWindow,
      timerValue: "15:00",
      timerRunning: false,
      interval: null,
      dateStarted: null
    };
  }

  updateTimer = () => {
    const { dateStarted, timerSeconds } = this.state;
    let currentTime = new Date();
    if (!dateStarted) {
      return;
    }
    const elapsedSeconds = Math.floor(
      (currentTime.valueOf() - dateStarted.valueOf()) / 1000
    );

    const remaining =
      initialTimeWindow - elapsedSeconds < 0
        ? 0
        : initialTimeWindow - elapsedSeconds;
    this.setState({
      timerSeconds: remaining
    });
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds - mins * 60;
    this.setState({
      timerValue: `${mins}:${secs < 10 ? "0" + secs : secs}`
    });
  };

  timerClick = () => {
    const { timerRunning, dateStarted, interval } = this.state;

    if (!timerRunning) {
      if (dateStarted === null) {
        this.setState({ dateStarted: new Date() });
      }
      this.setState({
        interval: setInterval(this.updateTimer.bind(this), 1000)
      });
    } else if (interval) {
      clearInterval(interval);
    }
    this.setState({ timerRunning: !timerRunning });
  };

  render() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.timerClick();
        }}
      >
        <View style={styles.timerContainer}>
          {this.state.timerRunning ? (
            <FaIcon
              name="pause"
              size={Metrics.icons.small}
              style={styles.timerIcon}
            />
          ) : (
            <FaIcon
              name="play"
              size={Metrics.icons.small}
              style={styles.timerIcon}
            />
          )}
          <Text style={styles.timerText}>{this.state.timerValue}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Metrics.baseMargin
  },
  timerIcon: {
    color: Colors.white,
    marginRight: Metrics.smallMargin
  },
  timerText: {
    color: Colors.white,
    fontSize: Fonts.size.large,
    fontWeight: "bold",
    fontFamily: Fonts.family.name
  }
});

export default Timer;

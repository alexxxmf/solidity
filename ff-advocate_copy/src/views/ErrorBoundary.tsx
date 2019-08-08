import { Component, ErrorInfo } from "react";
import { Alert } from "react-native";
import RNRestart from "react-native-restart";
import { logger } from "../utils/logging";

interface Props {}
interface State {
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  errorShown: boolean = false;

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    if (__DEV__) {
      return;
    }

    // to prevent multiple alerts shown to your users
    if (this.errorShown) {
      return;
    }

    this.errorShown = true;

    Alert.alert(
      "Error",
      "We are sorry, an unexpected error has occurred. Please restart to continue.",
      [
        {
          text: "Restart…",
          onPress: () => {
            RNRestart.Restart();
          }
        }
      ],
      { cancelable: false }
    );

    logger.error(`[Unexpected error]: ${error} ${errorInfo}`);
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;

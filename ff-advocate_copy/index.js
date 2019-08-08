import { AppRegistry, YellowBox } from "react-native";
import App from "./src/App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);

// Ignoring theses is not perfect BUT we can't run the Detox e2e test if not.
YellowBox.ignoreWarnings([
  "Warning: Async Storage has been extracted from react-native", // remove this when all the libraries are migrated to the `react-native-community` version https://github.com/react-native-community/async-storage/issues/138
  "Warning: NetInfo has been extracted from react-native", // remove this when all the libraries are migrated to the `react-native-community` version https://github.com/react-native-community/async-storage/issues/138
  "Remote debugger is in a background tab which may cause apps to perform slowly"
]);

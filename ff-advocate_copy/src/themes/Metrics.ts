import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Used via Metrics.baseMargin
const metrics = {
  marginHorizontal: 10,
  marginVertical: 10,
  section: 25,
  baseMargin: 10,
  tripleBaseMargin: 30,
  doubleBaseMargin: 20,
  smallMargin: 5,
  doubleSection: 50,
  horizontalLineHeight: 1,
  screenWidth: width < height ? width : height,
  screenHeight: width < height ? height : width,
  navBarHeight: Platform.OS === "ios" ? 64 : 54,
  screenHeightSmallDevices: 600,
  buttonRadius: 4,
  buttonRadiusDouble: 8,
  buttonBorder: 2,
  buttonPadding: 10,
  smallPadding: 5,
  basePadding: 10,
  borderWidth: {
    tiny: 1,
    small: 2,
    medium: 4,
    thick: 8
  },
  doublePadding: 20,
  triplePadding: 30,
  icons: {
    tiny: 15,
    small: 20,
    medium: 30,
    large: 45,
    xl: 60
  },
  images: {
    small: 20,
    medium: 40,
    large: 60,
    xlarge: 100,
    xxlarge: 150
  }
};

export default metrics;

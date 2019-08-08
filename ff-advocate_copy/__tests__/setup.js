jest.mock("Linking", () => {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn()
  };
});

jest.mock("WebView", () => "WebView");

jest.mock("react-native-device-info", () => {
  return {
    getUniqueID: jest.fn(() => "unique ID"),
    getDeviceId: jest.fn(() => "device ID"),
    getBrand: jest.fn(() => "apple"),
    getDeviceName: jest.fn(() => "iphone"),
    getModel: jest.fn(() => "iphone 2000"),
    getBuildNumber: jest.fn(() => "100"),
    getReadableVersion: jest.fn(() => "version 100"),
    getSystemName: jest.fn(() => "iphone os"),
    getSystemVersion: jest.fn(() => "os 1000")
  };
});

jest.mock("rollbar-react-native");

jest.mock("react-native-config", () => {
  return {
    USE_ROLLBAR: "false"
  };
});

export {};

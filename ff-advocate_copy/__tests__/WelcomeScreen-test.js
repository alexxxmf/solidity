/**
 * @jest-environment jsdom
 */
import React from "react";
import WelcomeScreen from "../src/views/WelcomeScreen";

import renderer from "react-test-renderer";

jest.mock("rollbar-react-native", () => {
  return {
    Client: function Client(data) {
      return { data, logError: console.warn("mocked") };
    }
  };
});

test("renders correctly", () => {
  const f = jest.fn();
  const tree = renderer
    .create(<WelcomeScreen navigation={f} screenProps={{ userName: null }} />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import AnalyticsProvider from "../src/views/AnalyticsProvider";
import AnalyticsContext from "../src/views/AnalyticsContext";
import renderer from "react-test-renderer";

import AsyncStorage from "@react-native-community/async-storage";

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

jest.mock("rollbar-react-native", () => {
  return {
    Client: function Client(data) {
      return { data, logError: console.warn("mocked") };
    },
    Configuration: function Configuration(options) {
      return options;
    }
  };
});

jest.mock("date-fns", () => {
  return {
    ...jest.requireActual("date-fns"),
    startOfToday: jest.fn(() => {
      return new Date("2019-01-01");
    })
  };
});

beforeAll(() => {
  jest.mock("@react-native-community/async-storage");
});

beforeEach(async () => {
  AsyncStorage.clear();
});

test("Correct context provided", async () => {
  AsyncStorage.clear();
  jest.useFakeTimers();
  const f = jest.fn();
  const tree = renderer.create(
    <AnalyticsProvider
      userEmail="harry.potter@example.com"
      userId="12345"
      userName="Harry Potter"
      brandingTitle="Testing"
    >
      <AnalyticsContext.Consumer>
        {context => f(context.state)}
      </AnalyticsContext.Consumer>
    </AnalyticsProvider>
  );
  const instance = tree.getInstance();
  expect(instance.state).toMatchSnapshot("initial state");

  // Set up subscription to activities feed. Items only published once device
  // data also loaded
  const activitiesSubscription = jest.fn();
  instance.activities.subscribe(activitiesSubscription);

  // Checking initial context pre-device load
  expect(f.mock.calls).toMatchSnapshot("initial context");
  f.mockReset();

  // Fire an activity before the device data is loaded
  instance.onActivity("before", "key", { foo: "bar" });
  // And assert its not passed into activity stream yet
  expect(activitiesSubscription.mock.calls).toMatchSnapshot(
    "no activities before mounting done"
  );

  // finish promises
  await flushPromises();

  expect(instance.state).toMatchSnapshot("state after ticks");

  // check full context
  expect(f.mock.calls).toMatchSnapshot("full context");

  // fire another activity, confirm both are then passed to subscription
  instance.onActivity("test", "key", { foo: "bar" });
  expect(activitiesSubscription.mock.calls).toMatchSnapshot(
    "activities after mount"
  );
});

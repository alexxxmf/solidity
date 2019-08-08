/**
 * @jest-environment jsdom
 */
import React from "react";
import SignOut, { SignOutInner } from "../SignOut";

import renderer from "react-test-renderer";
import {
  analyticsClient,
  apiClient,
  onboardingClient
} from "../../../../graphql/client";
import AnalyticsProvider from "../../../AnalyticsProvider";

jest.mock("react-native-branch", () => {
  return {
    logout: jest.fn()
  };
});

jest.mock("react-native-intercom", () => {
  return {
    logout: jest.fn()
  };
});

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

jest.mock("date-fns", () => {
  return {
    ...jest.requireActual("date-fns"),
    startOfToday: jest.fn(() => {
      return new Date("2019-01-01");
    })
  };
});

jest.mock("rollbar-react-native", () => {
  return {
    Client: function Client<T>(data: T) {
      return { data, logError: jest.fn() };
    },
    Configuration: function Configuration<T>(options: T) {
      return options;
    }
  };
});

const apiClientSpy = jest.spyOn(apiClient, "clearStore");
const analyticsClientSpy = jest.spyOn(analyticsClient, "clearStore");
const onboardingClientSpy = jest.spyOn(onboardingClient, "clearStore");

test("renders correctly", async () => {
  const dateNowMockFn = jest
    .spyOn(Date, "now")
    .mockImplementation(() => 1559238746862);

  const resetUserOptionsToDefault = jest.fn();
  const n: any = {
    navigate: jest.fn()
  };
  const onLogActivity = jest.fn();

  const tree = renderer.create(
    <AnalyticsProvider
      userEmail="harry@hogwarts.com"
      brandingTitle="testing"
      userId="1234"
      userName="Harry Potter"
      onLogActivity={onLogActivity}
    >
      <SignOut
        resetUserOptionsToDefault={resetUserOptionsToDefault}
        navigation={n}
      />
    </AnalyticsProvider>
  );
  expect(tree.toJSON()).toMatchSnapshot("Render");

  const instance: SignOutInner = tree.root.findByType(SignOutInner)
    .instance as any;

  if (instance) {
    await instance._wipeUser();
  }

  expect(onLogActivity.mock.calls).toMatchSnapshot("onActivity calls");
  expect(
    jest.requireMock("react-native-branch").logout.mock.calls
  ).toMatchSnapshot("branch logout calls");
  expect(
    jest.requireMock("react-native-intercom").logout.mock.calls
  ).toMatchSnapshot("intercom logout calls");
  expect(apiClientSpy).toHaveBeenCalled();
  expect(onboardingClientSpy).toHaveBeenCalled();
  expect(analyticsClientSpy).toHaveBeenCalled();
  expect(n.navigate.mock.calls).toMatchSnapshot("navigate calls");
  expect(resetUserOptionsToDefault).toHaveBeenCalled();

  dateNowMockFn.mockRestore();
});

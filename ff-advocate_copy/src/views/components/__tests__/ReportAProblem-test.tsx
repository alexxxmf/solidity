/**
 * @jest-environment jsdom
 */
import { fireEvent, render } from "react-native-testing-library";
import ReportAProblem from "../ReportAProblem";
import React from "react";

test("ReportAProblem", async () => {
  const intercom: any = {
    registerForPush: jest.fn(),
    displayMessenger: jest.fn(),
    registerIdentifiedUser: jest.fn(),
    updateUser: jest.fn()
  };
  const renderResult = render(
    <ReportAProblem
      userId={"1234"}
      userEmail={"harry@hogwarts.com"}
      userName={"Harry Potter"}
      intercom={intercom}
    />
  );

  // Default state
  expect(renderResult.toJSON()).toMatchSnapshot("Render default");
  expect(intercom.registerForPush).toHaveBeenCalled();

  // Ask for help
  await fireEvent.press(renderResult.getByTestId("askHelp"));
  expect(renderResult.toJSON()).toMatchSnapshot("After asking help");
  expect(intercom.displayMessenger).toHaveBeenCalled();
  expect(intercom.registerIdentifiedUser.mock.calls).toMatchSnapshot(
    "Register intercom user"
  );
  expect(intercom.updateUser.mock.calls).toMatchSnapshot(
    "Update intercom user"
  );
});

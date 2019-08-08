/**
 * @jest-environment jsdom
 */
import React from "react";
import UpdateDetails from "../UpdateDetails";

import { render, fireEvent } from "react-native-testing-library";
import { Modal } from "react-native";

test("UpdateDetails", async () => {
  jest.useFakeTimers();
  const onStoreUserName = jest.fn();

  const renderResult = render(
    <UpdateDetails
      userEmail={"harry@hogwarts.com"}
      userName={"Harry Potter"}
      onStoreUserName={onStoreUserName}
    />
  );

  // Default state
  expect(renderResult.toJSON()).toMatchSnapshot("Render default");

  // open the modal by pressing the menu item
  const openModal = () => {
    fireEvent.press(renderResult.getByTestId("updateName"));
  };
  openModal();
  expect(renderResult.toJSON()).toMatchSnapshot("Render after opening modal");

  // close the modal with a back button
  renderResult.getByType(Modal).props.onRequestClose();
  expect(renderResult.toJSON()).toMatchSnapshot("Render default");

  // re-open the modal, close with the close button
  openModal();
  fireEvent.press(renderResult.getByTestId("closeModal"));
  expect(renderResult.toJSON()).toMatchSnapshot("Render default");

  // re-open the modal, edit the username to something bad
  openModal();
  await fireEvent.changeText(renderResult.getByTestId("usernameInput"), "");
  // Formik validation is async
  await jest.runAllTimers();
  expect(renderResult.toJSON()).toMatchSnapshot("Render name error");

  // change to a good name, save, modal is closed
  fireEvent.changeText(
    renderResult.getByTestId("usernameInput"),
    "Hermione Granger"
  );
  await jest.runAllTimers();
  onStoreUserName.mockReturnValue(true);
  await fireEvent.press(renderResult.getByTestId("saveChanges"));
  await jest.runAllTimers();
  expect(onStoreUserName).toHaveBeenCalled();
  expect(onStoreUserName.mock.calls).toMatchSnapshot("Store user name");
  expect(renderResult.toJSON()).toMatchSnapshot("Render default");

  openModal();
  onStoreUserName.mockReset();
  onStoreUserName.mockImplementation((email, name, unexpectedError) => {
    unexpectedError();
  });
  await fireEvent.press(renderResult.getByTestId("saveChanges"));
  await jest.runAllTimers();
  expect(onStoreUserName.mock.calls).toMatchSnapshot("Store user name");
  expect(renderResult.toJSON()).toMatchSnapshot("Render with unexpected error");
});

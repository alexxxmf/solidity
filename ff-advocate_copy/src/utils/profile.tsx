import { UpdateUserOptionsArgs } from "../views/components/UserOptions";
import { logger } from "./logging";
import {
  UPDATE_USER_NAME_MUTATION,
  UpdateUserNameResult,
  UpdateUserNameVars
} from "../graphql/auth/mutations";
import { AsyncStorageStatic } from "@react-native-community/async-storage";
import { storageKeys } from "../config/storageKeys";
import { ApolloClient } from "apollo-client";

export const storeUserName = async (
  onUpdateUserOptions: (options: UpdateUserOptionsArgs) => Promise<void>,
  onboardingClient: ApolloClient<unknown>,
  storage: AsyncStorageStatic,
  userEmail: string,
  userName: string,
  onUnexpectedError?: () => void
): Promise<boolean> => {
  logger.debug("Storing user name", { userEmail, userName });
  const response = await onboardingClient.mutate<
    UpdateUserNameResult,
    UpdateUserNameVars
  >({
    mutation: UPDATE_USER_NAME_MUTATION,
    variables: {
      userEmail,
      userName
    },
    fetchPolicy: "no-cache"
  });

  if (!response.data) {
    logger.error(`[storeUserName error]: Unable to store updated username`);
    if (onUnexpectedError) {
      onUnexpectedError();
    }
    return false;
  }

  await onUpdateUserOptions(response.data.updateUsername);

  try {
    await storage.setItem(storageKeys.USER_NAME, userName);
  } catch (error) {
    logger.error(`[storeUserName error]: ${error}`);
    return false;
  }

  return true;
};

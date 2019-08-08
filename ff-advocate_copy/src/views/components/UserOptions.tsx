import { Component, ReactNode } from "react";
import Config from "react-native-config";
import AsyncStorage from "@react-native-community/async-storage";
import { storageKeys } from "../../config/storageKeys";
import { theme } from "../../config/theme";
import { DeliveryMetadata } from "../../types";
import { logger } from "../../utils/logging";
import { onboardingClient } from "../../graphql/client";
import {
  LIST_USER_PROGRAMMES,
  ListUserProgrammesResult,
  ListUserProgrammesVars
} from "../../graphql/auth/queries";
import {
  GetPersistentUserOptionsResult,
  GetPersistentUserOptionsVars,
  GET_PERSISTENT_USER_OPTIONS
} from "../../graphql/auth/mutations";
import * as _ from "lodash";

const defaultState = {
  brandingTitle: "",
  contentUri: Config.SESSION_URL,
  sessionsUri: Config.SESSIONS_CONFIG_URL,
  theme: theme,
  userId: null,
  userEmail: null,
  userName: null,
  userOptionsLoaded: false,
  deliveryMetadata: null,
  programmeId: null
};

export interface UpdateUserOptionsArgs {
  userId: string;
  sessionsConfigUrl: string;
  baseSessionContentUrl: string;
  email: string;
  userName: string | null;
  brandingTitle: string;
  programmeId: number;
  theme: {
    primary: string;
  };
  deliveryMetadata: null | DeliveryMetadata;
}

type RenderOptions = State & {
  updateUserOptions: (options: UpdateUserOptionsArgs) => Promise<void>;
  setUserEmail: (email: string) => Promise<void>;
  resetUserOptionsToDefault: () => Promise<void>;
};

interface Props {
  render: (renderOptions: RenderOptions) => ReactNode;
  onUpdatedUserOptions?: (userOptions: State) => void;
}

interface State {
  userId: string | null;
  brandingTitle: string;
  contentUri: string;
  sessionsUri: string;
  theme: { primary: string };
  userEmail: string | null;
  userName: string | null;
  programmeId: number | null;
  userOptionsLoaded: boolean;
  deliveryMetadata: null | DeliveryMetadata;
}

const getCurrentProgrammeId = async (email: string): Promise<number> => {
  const res = await onboardingClient.query<
    ListUserProgrammesResult,
    ListUserProgrammesVars
  >({
    query: LIST_USER_PROGRAMMES,
    variables: {
      userEmail: email
    }
  });

  if (!res.data) {
    logger.warn("Unable to load current programme ID when rehydrating app", {
      email
    });
    return 111111;
  }

  const { programmes } = res.data.listUserProgrammes;

  try {
    const { programmeId } = programmes.filter(p => p.currentProgramme)[0];
    return programmeId;
  } catch (e) {
    logger.warn(
      "Unable to load current programme ID by filtering user's listed programmes",
      { email }
    );
    return 111111;
  }
};

const canUsePersistedUserModel = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedPersistedState: any | null
): Promise<boolean> => {
  // can't use persisted data if it doesn't exist or its missing key fields (id, email)
  const nothingPersistedOrKeyed =
    !parsedPersistedState ||
    !parsedPersistedState.userId ||
    !parsedPersistedState.userEmail;

  if (nothingPersistedOrKeyed) {
    return false;
  }

  // special-case: we can recover if programmeId is missing
  if (!parsedPersistedState.programmeId) {
    parsedPersistedState.programmeId = await getCurrentProgrammeId(
      parsedPersistedState.userEmail
    );
    await AsyncStorage.setItem(
      storageKeys.persistedUpdatedOptions,
      JSON.stringify({ ...parsedPersistedState })
    );
  }

  // can't use persisted data if it is missing fields added during upgrade
  const cannotBeUndefined = ["programmeId"];

  return _.every(
    cannotBeUndefined,
    (fieldName: string) => parsedPersistedState[fieldName] !== undefined
  );
};

class UserOptions extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      ...defaultState
    };
  }

  _updateState = async (updatedUserOptions: State) => {
    logger.info("Updating User Options", updatedUserOptions);
    return new Promise(resolve => {
      this.setState(updatedUserOptions, async () => {
        if (
          updatedUserOptions.userId &&
          updatedUserOptions.userName &&
          updatedUserOptions.userEmail
        ) {
          logger.debug(
            "Updated User Options imply new user to set for logging"
          );
          logger.setPerson(
            updatedUserOptions.userId,
            updatedUserOptions.userName,
            updatedUserOptions.userEmail
          );
        }
        await AsyncStorage.setItem(
          storageKeys.persistedUpdatedOptions,
          JSON.stringify({ ...this.state })
        );
        if (this.props.onUpdatedUserOptions) {
          this.props.onUpdatedUserOptions(this.state);
        }
        resolve();
      });
    });
  };

  setUserEmail = async (email: string) => {
    logger.debug("Updating user's email address only", { email });
    await this._updateState({
      ...this.state,
      userEmail: email
    });
  };

  updateUserOptions = async (userOptions: UpdateUserOptionsArgs) => {
    const updatedUserOptions: Partial<State> = {
      ...userOptions,
      userEmail: userOptions.email,
      contentUri: userOptions.baseSessionContentUrl,
      sessionsUri: userOptions.sessionsConfigUrl,
      deliveryMetadata: userOptions.deliveryMetadata
    };

    await this._updateState(updatedUserOptions as State);
  };

  resetUserOptionsToDefault = async () => {
    logger.info("Resetting user options wholesale");
    await this._updateState({ ...defaultState, userOptionsLoaded: true });
    logger.clearPerson();
  };

  getPersistentUserOptions = async (token: string) => {
    const res = await onboardingClient.query<
      GetPersistentUserOptionsResult,
      GetPersistentUserOptionsVars
    >({
      query: GET_PERSISTENT_USER_OPTIONS,
      variables: {
        token: token
      }
    });

    if (!res.data) {
      logger.warn("Unable to load persistent user options", {
        token
      });
    }

    return res.data.getPersistentUserOptions.userOptions;
  };

  async componentDidMount() {
    const persistedState = await AsyncStorage.getItem(
      storageKeys.persistedUpdatedOptions
    );
    let parsedPersistedState = JSON.parse(persistedState || "null");
    const persistentUserToken: string | null = await AsyncStorage.getItem(
      storageKeys.persistentUserToken
    );

    logger.info("Loaded persisted user options state", parsedPersistedState);

    const canUseExisting = await canUsePersistedUserModel(parsedPersistedState);
    if (canUseExisting) {
      logger.info(
        "Loading users options from persisted data",
        parsedPersistedState
      );
      this.setState({ ...parsedPersistedState });
      logger.setPerson(
        parsedPersistedState.userId,
        parsedPersistedState.userName,
        parsedPersistedState.userEmail
      );
      this.setState({ userOptionsLoaded: true });
      return;
    } else if (persistentUserToken) {
      logger.info(
        "Loading users options from persistent user token",
        parsedPersistedState,
        persistentUserToken
      );
      const userOptions = await this.getPersistentUserOptions(
        persistentUserToken
      );
      parsedPersistedState = { ...userOptions };
      await AsyncStorage.setItem(
        storageKeys.persistedUpdatedOptions,
        JSON.stringify({ ...parsedPersistedState })
      );
      this.setState({ ...parsedPersistedState });
      logger.setPerson(
        parsedPersistedState.userId,
        parsedPersistedState.userName,
        parsedPersistedState.userEmail
      );
      this.setState({ userOptionsLoaded: true });
      return;
    } else {
      logger.info("No logged in user");
      this.setState({ userOptionsLoaded: true });
      return;
    }
  }

  render() {
    return this.props.render({
      ...this.state,
      updateUserOptions: this.updateUserOptions,
      setUserEmail: this.setUserEmail,
      resetUserOptionsToDefault: this.resetUserOptionsToDefault
    });
  }
}

export default UserOptions;

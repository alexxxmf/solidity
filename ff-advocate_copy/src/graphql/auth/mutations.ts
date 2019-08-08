import gql from "graphql-tag";
import { DeliveryMetadata } from "../../types";

export const CREATE_EMAIL_TOKEN_MUTATION = gql`
  mutation sendEmail($email: String!) {
    sendLoginReminder(email: $email) {
      sent
      email
    }
  }
`;

export interface CreateEmailTokenVars {
  email: string;
}

export interface CreateEmailTokenResult {
  sendLoginReminder: {
    sent: boolean;
    email: string;
  };
}

const userOptionsFragment = gql`
  fragment AllOptions on UserOptions {
    email
    userName
    sessionsConfigUrl
    baseSessionContentUrl
    brandingTitle
    programmeId
    theme {
      primary
    }
    userId
    deliveryMetadata {
      location {
        label
        required
        format
      }
    }
  }
`;

export interface UserOptions {
  sessionsConfigUrl: string;
  baseSessionContentUrl: string;
  email: string;
  userId: string;
  userName: string | null;
  brandingTitle: string;
  programmeId: number;
  theme: {
    primary: string;
  };
  deliveryMetadata: null | DeliveryMetadata;
}

export const UPDATE_USER_NAME_MUTATION = gql`
  mutation updateUsername($userEmail: String!, $userName: String!) {
    updateUsername(userEmail: $userEmail, userName: $userName) {
      ...AllOptions
    }
  }
  ${userOptionsFragment}
`;

export interface UpdateUserNameVars {
  userEmail: string;
  userName: string;
}

export interface UpdateUserNameResult {
  updateUsername: UserOptions;
}

export const CHECK_PROGRAMME_CODE_MUTATION = gql`
  mutation checkCode($programmeCode: String!, $userEmail: String!) {
    checkProgrammeCode(programmeCode: $programmeCode, userEmail: $userEmail) {
      valid
      userOptions {
        ...AllOptions
      }
    }
  }
  ${userOptionsFragment}
`;

export interface CheckProgrammeCodeVars {
  programmeCode: string;
  userEmail: string;
}

export interface CheckProgrammeCodeResult {
  checkProgrammeCode: {
    valid: boolean;
    userOptions: UserOptions;
  };
}

export const UPDATE_CURRENT_PROGRAMME_MUTATION = gql`
  mutation switchProgramme($userEmail: String!, $programmeId: Int!) {
    switchCurrentProgramme(userEmail: $userEmail, programmeId: $programmeId) {
      ...AllOptions
    }
  }
  ${userOptionsFragment}
`;

export interface UpdateCurrentProgrammeVars {
  userEmail: string;
  programmeId: number;
}

export interface UpdateCurrentProgrammeResult {
  switchCurrentProgramme: UserOptions;
}

// TODO Look at codegen options for these
export const CHECK_LOGIN_TOKEN = gql`
  mutation loginToken($token: String!) {
    checkLoginToken(token: $token) {
      valid
      userOptions {
        ...AllOptions
      }
      persistentUserToken
    }
  }
  ${userOptionsFragment}
`;

export interface CheckLoginTokenVars {
  token: string;
}

export interface CheckLoginTokenResult {
  checkLoginToken: {
    valid: boolean;
    userOptions: UserOptions;
    persistentUserToken: string;
  };
}

export const GET_PERSISTENT_USER_OPTIONS = gql`
  mutation getPersistentUserOptions($token: String!) {
    getPersistentUserOptions(token: $token) {
      userOptions {
        ...AllOptions
      }
    }
  }
  ${userOptionsFragment}
`;

export interface GetPersistentUserOptionsVars {
  token: string;
}

export interface GetPersistentUserOptionsResult {
  getPersistentUserOptions: {
    userOptions: UserOptions;
  };
}

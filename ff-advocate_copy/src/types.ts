// TODO: This can be moved to App.tsx when that's converted
import { UpdateUserOptionsArgs } from "./views/components/UserOptions";
import {
  NavigationParams,
  NavigationRoute,
  NavigationScreenProp
} from "react-navigation";
import { UserOptions } from "./graphql/auth/mutations";

export interface DeliveryMetadata {
  location: null | {
    label: string;
    required: boolean;
    format: string;
  };
}

export interface AppScreenProps {
  loadingLocalData: boolean;
  onCompletedSessionPrepare: (
    userId: string,
    userEmail: string,
    session: string,
    sessionStart: Date
  ) => Promise<void>;
  onCompletedSessionDelivery: (
    options: DeliveredSessionOptions
  ) => Promise<void>;
  setSessionAndParticipantsCount: (
    session: string,
    participantsNumberPending: number
  ) => void;
  setSessionDeliveryLocation: (deliveryLocation: string) => void;
  updateUserOptions: (options: UpdateUserOptionsArgs) => Promise<void>;
  setUserEmail: (email: string) => Promise<void>;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  programmeId: number | null;
  sessionsUri: string;
  resetUserOptionsToDefault: () => Promise<void>;
  brandingTitle: string;
  contentUri: string;
  theme: { primary: string };
  deliveryMetadata: null | DeliveryMetadata;
  deliveryLocation: string | null;
  changeProgrammeById: (
    email: string,
    programmeId: number,
    navigation: NavigationScreenProp<
      NavigationRoute<NavigationParams>,
      NavigationParams
    >
  ) => void;
  changeProgrammeByOptions: (
    userOptions: UserOptions,
    navigation: NavigationScreenProp<
      NavigationRoute<NavigationParams>,
      NavigationParams
    >
  ) => void;
}

export type CompletedProfileAppScreenProps = AppScreenProps & {
  userId: string;
  userEmail: string;
  userName: string;
  programmeId: number;
};

export interface PendingSessionAttendanceCount {
  [key: string]: number | undefined;
}

export interface DeliveredSession {
  userEmail: string;
  session: string;
  sessionStart: Date;
  sessionEnd: Date;
  participantsCount: number;
}

export interface DeliveredSessionOptions {
  userId: string;
  userEmail: string;
  topicTitle: string;
  sessionStart: Date;
  sessionEnd: Date;
  userName: string;
  brandingTitle: string;
  topicUniqueId: string;
  topicContentId: string;
  configName: string;
  uri: string;
}

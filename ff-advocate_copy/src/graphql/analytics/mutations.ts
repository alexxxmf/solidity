import gql from "graphql-tag";

export const LOG_SINGLE_ACTIVITY = gql`
  mutation logActivity(
    $userId: String!
    $userDataString: JSONString!
    $deviceId: String!
    $deviceDataString: JSONString!
    $activity: LogActivityInput!
  ) {
    logActivities(
      currentUser: { id: $userId, data: $userDataString }
      currentDevice: { id: $deviceId, data: $deviceDataString }
      activities: [$activity]
    ) {
      currentUser {
        id
        data
        created
        updated
      }
      currentDevice {
        id
        data
        created
        updated
      }
      activities {
        id
        data
        created
        updated
        loggedAt
        clientId
        activityType
        activityKey
      }
    }
  }
`;

export interface LogActivityResult {
  logActivities: {
    currentUser: {
      id: string;
      data: string;
      created: string;
      updated: string;
    };
    currentDevice: {
      id: string;
      data: string;
      created: string;
      updated: string;
    };
    activities: {
      id: string;
      data: string;
      created: string;
      updated: string;
      loggedAt: string;
      clientId: string;
      activityType: string;
      activityKey: string;
    }[];
  };
}

export interface LogActivityVars {
  userId: string;
  userDataString: string;
  deviceId: string;
  deviceDataString: string;
  activity: {
    activityType: string;
    activityKey: string;
    data: string;
    loggedAt?: string;
    clientId?: string;
  };
}

export const LOG_DELIVERED_SESSION_MUTATION = gql`
  mutation logDelivery(
    $extra: JSONString!
    $sessionEnd: DateTime!
    $sessionStart: DateTime!
    $sessionId: String!
    $userEmail: String!
    $participants: JSONString
    $participantsCount: Int
    $clientId: String!
  ) {
    logDeliveredSession(
      extra: $extra
      sessionEnd: $sessionEnd
      sessionStart: $sessionStart
      sessionId: $sessionId
      userEmail: $userEmail
      participants: $participants
      participantsCount: $participantsCount
      clientId: $clientId
    ) {
      deliveredSessionId
    }
  }
`;

export interface LogDeliveredSessionResult {
  logDeliveredSession: {
    deliveredSessionId: string;
  };
}

export interface LogDeliveredSessionVars {
  userEmail: string;
  sessionId: string;
  sessionStart: string;
  sessionEnd: string;
  participants: string | undefined;
  participantsCount: number | undefined;
  extra: string;
  clientId: string;
}

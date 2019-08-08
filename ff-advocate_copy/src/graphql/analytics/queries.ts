import gql from "graphql-tag";

export const GET_ACTIVATION_DETAILS = gql`
  query getActivationDetails($programmeId: Int!, $userEmail: String!) {
    activationDetails(programmeId: $programmeId, userEmail: $userEmail) {
      requestBooking {
        enabled
        useCoachCalls
        requestMessage
        requestUrl
      }
      bookedActivation {
        bookingMessage
        bookingStarts
        bookingUrl
      }
    }
  }
`;

export interface GetActivationDetailsVars {
  programmeId: number;
  userEmail: string;
}

export interface ActivationRequestBooking {
  enabled: boolean;
  useCoachCalls: boolean;
  requestMessage: string;
  requestUrl: string | null;
}

export interface ActivationBooking {
  bookingMessage: string;
  bookingStarts: string;
  bookingUrl: string | null;
}

export interface GetActivationDetailsResult {
  activationDetails: {
    requestBooking: ActivationRequestBooking;
    bookedActivation: null | ActivationBooking;
  } | null;
}

export const PROGRAMME_SUPPORTS_ACTIVATION = gql`
  query getProgrammeSupportsActivation($programmeId: Int!) {
    programmeSupportsActivation(programmeId: $programmeId)
  }
`;

export interface ProgrammeSupportsActivationVars {
  programmeId: number;
}

export interface ProgrammeSupportsActivationResult {
  programmeSupportsActivation: boolean;
}

export const GET_COACH_CALLS_DETAILS = gql`
  query getListUpcomingCoachCalls($programmeId: Int!) {
    listUpcomingCoachCalls(programmeId: $programmeId) {
      count
      calls {
        callStarts
        callUrl
        callMessage
      }
    }
  }
`;

export interface GetListUpcomingCoachCalls {
  programmeId: number;
}

export interface StartCall {
  callStarts: string;
  callUrl: string;
  callMessage: string;
}

export interface GetCoachCallsResult {
  listUpcomingCoachCalls: {
    count: number;
    calls: StartCall[];
  };
}

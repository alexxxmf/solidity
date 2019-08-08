import gql from "graphql-tag";

export const BOOK_ACTIVATION_SESSION = gql`
  mutation bookUserActivationSession(
    $bookingStarts: DateTime!,
    $userEmail: String!,
    $programmeId: Int!,
    $bookingMessage: String!,
    $bookingUrl: String
  ) {
    bookUserActivationSession(
      input: {
        bookingStarts: $bookingStarts
        userEmail: $userEmail
        programmeId: $programmeId
        bookingMessage: $bookingMessage
        bookingUrl: $bookingUrl
      }
    ) {
      bookedActivation {
        created
      }
    }
  }
`;

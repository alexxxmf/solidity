import { dynamoDb } from "../config";
import { MutationResolvers, LogDeliveredSessionResult } from "../generated/types";
import * as uuid from "uuid";

export const logDeliveredSession: MutationResolvers["logDeliveredSession"] = async (
  _,
  { input: { userEmail, sessionId, sessionStart, sessionEnd, participants, participantsCount, extra } }
): Promise<LogDeliveredSessionResult> => {
  const deliveredSessionId = uuid.v4();
  return new Promise((resolve, reject) => {
    dynamoDb.put(
      {
        TableName: process.env.DYNAMODB_DELIVERED_SESSIONS_TABLE,
        Item: {
          deliveredSessionId,
          userEmail,
          sessionId,
          sessionStart,
          sessionEnd,
          participants: participants ? JSON.parse(participants) : [],
          participantsCount: participantsCount || 0,
          extra: JSON.parse(extra)
        }
      },
      error => {
        if (error) {
          reject(error);
        }

        resolve({
          deliveredSessionId
        });
      }
    );
  });
};

import Intercom from "react-native-intercom";
import { logger } from "./logging";

export const logSessionCompletedEvent = async (
  userId: string,
  userEmail: string,
  session: string,
  sessionStart: Date,
  sessionEnd: Date
) => {
  const timeDiff = sessionEnd.valueOf() - sessionStart.valueOf();
  const seconds = Math.round(timeDiff / 1000);
  const timePassed = new Date(seconds * 1000);

  // @ts-ignore for email option with Intercom
  await Intercom.registerIdentifiedUser({ userId: userId, email: userEmail });
  const metadata = {
    session: session,
    time_completed_in:
      timePassed.getHours() +
      " hours " +
      timePassed.getMinutes() +
      " minutes " +
      timePassed.getSeconds() +
      " seconds."
  };
  logger.debug("Logging `session_completed` to Intercom", metadata);
  await Intercom.logEvent("session_completed", metadata);
};

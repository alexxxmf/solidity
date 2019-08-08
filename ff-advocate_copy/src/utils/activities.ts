import { Activity } from "../views/AnalyticsProvider";
import {
  LOG_SINGLE_ACTIVITY,
  LogActivityResult,
  LogActivityVars
} from "../graphql/analytics/mutations";
import { logger } from "./logging";
import { ApolloClient } from "apollo-client";
import UUIDGenerator from "react-native-uuid-generator";

export const logActivity = async (
  analyticsClient: ApolloClient<unknown>,
  { user, device, activity }: Activity
) => {
  const { userEmail, ...userData } = user;

  const { deviceUniqueId, ...deviceData } = device;

  // This ensures that event if the network fails and the apollo client retries, only a single activity is logged
  const clientId = await UUIDGenerator.getRandomUUID();

  try {
    const mutationOptions = {
      userId: userEmail,
      deviceId: deviceUniqueId || "unknown device",
      userDataString: JSON.stringify(userData),
      deviceDataString: JSON.stringify(deviceData),
      activity: {
        ...activity,
        clientId,
        data: JSON.stringify(activity.data)
      }
    };
    await analyticsClient.mutate<LogActivityResult, LogActivityVars>({
      mutation: LOG_SINGLE_ACTIVITY,
      variables: mutationOptions,
      fetchPolicy: "no-cache"
    });
    logger.info("Activity success", { mutationOptions });
  } catch (e) {
    // raised if retries fail
    logger.error("Activity error", e.message);
  }
};

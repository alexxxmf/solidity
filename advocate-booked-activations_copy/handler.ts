import apiClient from "./client";
import { BOOK_ACTIVATION_SESSION } from "./mutations";

export const syncCalendlyDatas = async (event, context) => {

  if (
    event.headers &&
    event.headers["X-Calendly-Hook-Id"]
  ) {

    if (event.headers["X-Calendly-Hook-Id"] === process.env.CALENDLY_WEBHOOK_SUBSCRIPTION_ID) {
      const parsedIncomingData = JSON.parse(event.body)

      const data = {
        userEmail: parsedIncomingData.payload.invitee.email,
        programmeId: parsedIncomingData.payload.tracking.utm_programme_id,
        bookingStarts: parsedIncomingData.payload.event.invitee_start_time,
        bookingUrl: parsedIncomingData.payload.tracking.utm_booking_url ? event.body.payload.tracking.utm_booking_url : "",
        bookingMessage: parsedIncomingData.payload.tracking.utm_message
      }

      try {
        console.log(`:::Calling API:::}`)
        const response = await apiClient.mutate({
          mutation: BOOK_ACTIVATION_SESSION,
          variables: data
        });

        return {
          statusCode: 200,
          message:
            "Success"
        };
      } catch(error) {
        console.error(error);
        return {
          statusCode: 400,
          message: error
        };
      }
    } else {
      console.log("wrong hook id")
      return {
        statusCode: 400,
        message:
          "Wrong HookId!"
      };
    }

  } else {
    console.log("Non-calendly call")
    return {
      statusCode: 400,
      message:
        "Non-calendly call"
    };
  }

};

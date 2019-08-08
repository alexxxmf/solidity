import React from "react";

export interface AnalyticsContextValue {
  state: {
    appReadableVersion: string | null;
  };
  onActivity: (
    activityType: string,
    activityKey?: string | null,
    data?: {} | null
  ) => Promise<void>;
  acceptedVersion: boolean;
}

type Value = null | AnalyticsContextValue;

const AnalyticsContext = React.createContext<Value>(null);

export default AnalyticsContext;

import React from "react";
import { Activity } from "./AnalyticsProvider";

type Value = null | {
  data: Activity[];
};

const AnalyticsDebugContext = React.createContext<Value>(null);

export default AnalyticsDebugContext;

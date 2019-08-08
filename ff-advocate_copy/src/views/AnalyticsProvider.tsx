import React, { Component } from "react";
import { AppState, Platform, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import DeviceInfo from "react-native-device-info";
import { format, startOfToday } from "date-fns";
import { logger } from "../utils/logging";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import AnalyticsDebugContext from "./AnalyticsDebugContext";
import { ReplaySubject, Subject } from "rxjs";
import ApolloClient from "apollo-client";
import {
  CHECK_MINIMUM_VERSION,
  CheckMinVersionVars,
  CheckMinVersionResult,
  AppPlatform
} from "../graphql/auth/queries";
import { storageKeys } from "../config/storageKeys";

interface Props<TCacheShape> {
  userEmail: string | null;
  brandingTitle: string;
  userId: string;
  userName: string;
  client?: ApolloClient<TCacheShape>;
  onLogActivity?: (activity: Activity) => Promise<void>;
}

interface State {
  deviceData: {
    deviceDataLoaded: boolean;
    deviceUniqueId: string | null;
    deviceTypeId: string | null;
    deviceBrand: string | null;
    deviceName: string | null;
    deviceModel: string | null;
    deviceOS: string | null;
    appFirstInstallTime: string | null;
    appBuildNumber: string | null;
    appReadableVersion: string | null;
    appState: AppStateStatus;
    osName: string | null;
  };
  versionAccepted: boolean;
  eventLog: Activity[];
  storedDataLoaded: boolean;
}

interface InternalActivity {
  activityType: string;
  activityKey: string;
  data: {};
}

export interface Activity {
  user: {
    userEmail: string;
    brandingTitle: string;
    userId: string;
    userName: string;
  };
  device: State["deviceData"];
  activity: InternalActivity;
}

class AnalyticsProvider<TCacheShape> extends Component<
  Props<TCacheShape>,
  State
> {
  state: State = {
    deviceData: {
      deviceDataLoaded: false,
      deviceUniqueId: null,
      deviceTypeId: null,
      deviceBrand: null,
      deviceName: null,
      deviceModel: null,
      deviceOS: null,
      appFirstInstallTime: null,
      appBuildNumber: null,
      appReadableVersion: null,
      appState: "active",
      osName: null
    },
    versionAccepted: true,
    eventLog: [],
    storedDataLoaded: false
  };

  // Activities can be submitted before device/user data ready
  _submittedActivities = new ReplaySubject<InternalActivity>();

  activities = new Subject<Activity>();

  async componentDidMount() {
    await this._refreshDeviceData();

    this.activities.subscribe(this._logActivity);

    this.activities.subscribe(this._createEventLog);

    await this._loadStoredEventLog();

    AppState.addEventListener("change", this._handleAppStateChange);

    this._submittedActivities.subscribe(activity => {
      if (!this.props.userEmail) {
        return;
      }
      const user = {
        userEmail: this.props.userEmail,
        brandingTitle: this.props.brandingTitle,
        userId: this.props.userId,
        userName: this.props.userName
      };
      const device = { ...this.state.deviceData };

      this.activities.next({ user, device, activity });
    });
  }

  _isVersionAccepted = async (
    currentVersion: string | null,
    platform: AppPlatform | null
  ): Promise<boolean> => {
    if (currentVersion && platform && this.props.client) {
      const response = await this.props.client.query<
        CheckMinVersionResult,
        CheckMinVersionVars
      >({
        query: CHECK_MINIMUM_VERSION,
        variables: {
          platform: platform,
          currentVersion: currentVersion
        },
        fetchPolicy: "no-cache"
      });
      logger.debug(
        `Acceptable minimum version returned
        ${response.data.acceptableMinimumVersion.versionAccepted}`
      );
      return response.data.acceptableMinimumVersion.versionAccepted;
    } else {
      logger.warn(
        `No current version, platform or client provided for
        [isVersionAccepted], version: ${currentVersion}, platform: ${platform},
        client: ${this.props.client}`
      );
      return true;
    }
  };

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
    this._submittedActivities.unsubscribe();
    this.setState({ eventLog: [] });
  }

  _loadStoredEventLog = async () => {
    const storedEventLog = await AsyncStorage.getItem(storageKeys.eventLog);
    if (storedEventLog) {
      const parsed = JSON.parse(storedEventLog);
      const eventLog = [...parsed, ...this.state.eventLog];
      this.setState({ eventLog, storedDataLoaded: true });
    }
  };

  _createEventLog = (activity: Activity) => {
    const eventLog = [...this.state.eventLog, activity];
    eventLog.reverse().slice(0, 99);
    this.setState({ eventLog }, async () => {
      if (this.state.storedDataLoaded) {
        await AsyncStorage.setItem(
          storageKeys.eventLog,
          JSON.stringify(this.state.eventLog)
        );
      }
    });
  };

  _logActivity = async ({ user, device, activity }: Activity) => {
    if (this.props.onLogActivity) {
      await this.props.onLogActivity({ user, device, activity });
    }
  };

  _refreshDeviceData = async () => {
    const installDates = await this._getAppInstallDate();
    const deviceInfos = await this._getDeviceInfos();
    const buildInfos = await this._getAppBuildInfos();

    const deviceData = {
      ...installDates,
      ...deviceInfos,
      ...buildInfos,
      deviceDataLoaded: true,
      appState: "active" as AppStateStatus
    };

    const { appReadableVersion, osName } = deviceData;
    const platform: AppPlatform | null = osName
      ? ((osName.toLowerCase() as unknown) as AppPlatform)
      : null;

    const versionAccepted = await this._isVersionAccepted(
      appReadableVersion,
      platform
    );

    this.setState({
      deviceData,
      versionAccepted
    });

    logger.info(`[_refreshDeviceData] completed`, {
      deviceData,
      versionAccepted
    });
  };

  _handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const { appState } = this.state.deviceData;
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      await this._refreshDeviceData();
    }
  };

  _getDeviceInfos = () => {
    const deviceUniqueId = DeviceInfo.getUniqueID();
    const deviceTypeId = DeviceInfo.getDeviceId();
    const deviceBrand = DeviceInfo.getBrand();
    const deviceName = DeviceInfo.getDeviceName();
    const deviceModel = DeviceInfo.getModel();

    return {
      deviceUniqueId,
      deviceTypeId,
      deviceBrand,
      deviceName,
      deviceModel
    };
  };

  _getAppBuildInfos = () => {
    const appBuildNumber = DeviceInfo.getBuildNumber();
    const appReadableVersion = DeviceInfo.getReadableVersion();
    const deviceOS = `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`;
    const osName = DeviceInfo.getSystemName();

    return {
      appBuildNumber,
      appReadableVersion,
      deviceOS,
      osName
    };
  };

  _getAppInstallDate = async () => {
    let appFirstInstallTime = "";
    if (Platform.OS === "android") {
      appFirstInstallTime = format(
        DeviceInfo.getFirstInstallTime(),
        "DD/MM/YYYY"
      );
    } else {
      // getFirstInstallTime() is not available on iOS
      const installDateSaved = await AsyncStorage.getItem("APP_INSTALL_DATE");

      if (installDateSaved === null) {
        appFirstInstallTime = format(startOfToday(), "DD/MM/YYYY");
        await this._iOSstoreAppInstallDate(appFirstInstallTime);
      }
    }

    return {
      appFirstInstallTime
    };
  };

  _iOSstoreAppInstallDate = async (date: string) => {
    try {
      await AsyncStorage.setItem("APP_INSTALL_DATE", date);
    } catch (error) {
      logger.error(`[storeAppInstallDate error]: ${error}`);
    }
  };

  onActivity = async (
    activityType: string,
    activityKey: string | null = null,
    data: {} | null = null
  ) => {
    logger.info("Activity log", { activityType, activityKey, data });
    this._submittedActivities.next({
      activityType,
      activityKey: activityKey || "app",
      data: data || {}
    });
  };

  render() {
    return (
      <AnalyticsContext.Provider
        value={{
          state: this.state.deviceData,
          acceptedVersion: this.state.versionAccepted,
          onActivity: this.onActivity
        }}
      >
        <AnalyticsDebugContext.Provider value={{ data: this.state.eventLog }}>
          {this.props.children}
        </AnalyticsDebugContext.Provider>
      </AnalyticsContext.Provider>
    );
  }
}

export default AnalyticsProvider;

export const onFirstLaunch = (context: AnalyticsContextValue) => {
  context.onActivity("first launch");
};

export const onLaunch = (context: AnalyticsContextValue) => {
  context.onActivity("launch");
};

export const onAttributeExplored = (
  context: AnalyticsContextValue,
  attributeId: string,
  data: { attribute: string }
) => {
  context.onActivity("attribute explored", attributeId, data);
};

interface AdaptDeliveryActivity {
  adaptActivityId: string; // UUID, same for all activity related to one "visit" to a course
  topicUniqueId: string; // e.g.tesco:1.01:en:29
  topicContentId: string; // e.g. 29
  configName: string; // e.g. tesco
  topicTitle: string; // e.g. Always Learning
  uri: string; // e.g. https:// content.freeformers.com/xxxxxx
  advocateMode: "Deliver" | "Prepare";
  componentTitle: string; // e.g. What's it all about
  sessionStart: Date;
  deliveryLocation: string | null; // e.g. store code if applicable
  participantsCount: number | null; // e.g. number delivered to, if applicable
}

type AdaptPostDeliveryActivity = AdaptDeliveryActivity & {
  sessionEnd: Date;
};

export const onUserFeedbackSkipped = (
  context: AnalyticsContextValue,
  topicUniqueId: string,
  data: AdaptPostDeliveryActivity
) => {
  context.onActivity("user feedback skipped", topicUniqueId, data);
};

export const onUserFeedbackComplete = (
  context: AnalyticsContextValue,
  topicUniqueId: string,
  data: AdaptPostDeliveryActivity & {
    feedbackValue: number;
    question: string;
    answer: string;
  }
) => {
  context.onActivity("user feedback complete", topicUniqueId, data);
};

export const onTokenError = (context: AnalyticsContextValue) => {
  context.onActivity("token error");
};

export const onLoginComplete = (context: AnalyticsContextValue) => {
  context.onActivity("login complete");
};

export const onLoginEmailSent = (
  context: AnalyticsContextValue,
  cleanedEmail: string
) => {
  context.onActivity("Login email sent", "app", cleanedEmail);
};

export const onStartSignOut = (context: AnalyticsContextValue) => {
  context.onActivity("start sign out", "app", {
    signOutDate: new Date(Date.now())
  });
};

export const onTestBuildNumber = (context: AnalyticsContextValue) => {
  context.onActivity("test-button", "build-number", {});
};

export const onStartAdaptCourse = (
  context: AnalyticsContextValue,
  topicUniqueId: string,
  data: AdaptDeliveryActivity
) => {
  context.onActivity("start adapt course", topicUniqueId, data);
};

export const onEndAdaptCourse = (
  context: AnalyticsContextValue,
  topicUniqueId: string,
  data: AdaptPostDeliveryActivity
) => {
  context.onActivity("end adapt course", topicUniqueId, data);
};

export const onDeliveredSessionActivity = (
  context: AnalyticsContextValue,
  topicUniqueId: string,
  data: AdaptPostDeliveryActivity
) => {
  context.onActivity("delivered session", topicUniqueId, data);
};

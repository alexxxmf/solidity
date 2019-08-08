/* global __DEV__ */
/* eslint-disable no-console */
import { Client, Configuration } from "rollbar-react-native";
import Config from "react-native-config";
import { LogArgument } from "rollbar";
import DeviceInfo from "react-native-device-info";

const useRollbar: boolean = JSON.parse(Config.USE_ROLLBAR);
const rollbarAccessToken: string = Config.ROLLBAR_CLIENT_TOKEN;

let rollbar: Client | undefined = undefined;

if (useRollbar && rollbarAccessToken) {
  const buildNumber = DeviceInfo.getBuildNumber();
  const osName = DeviceInfo.getSystemName();

  const payload = {
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: `${buildNumber}.${osName}`
      }
    }
  };

  const rollbarOptions = {
    // If set, anything sent to Rollbar is also logged to the console
    verbose: __DEV__ || Config.ROLLBAR_VERBOSE,
    // Message level to send to Rollbar and/or the console (if verbose is set)
    reportLevel: Config.ROLLBAR_REPORT_LEVEL || "info",
    // Default level used when calling generic method rollbar.log
    logLevel: Config.ROLLBAR_LOG_LEVEL || "error",
    payload: !__DEV__ ? payload : undefined
  };

  const rollbarConfig = new Configuration(rollbarAccessToken, rollbarOptions);

  rollbar = new Client(rollbarConfig);
}

class Logger {
  constructor(rollbar?: Client) {
    this.rollbar = rollbar;
  }

  rollbar?: Client;

  debug = (...args: LogArgument[]) => {
    // Not seeing these in dev mode? Chrome by default filters out debug level statements.
    return this.rollbar
      ? this.rollbar.debug(...args)
      : console.debug("---", ...args);
  };

  info = (...args: LogArgument[]) => {
    return this.rollbar
      ? this.rollbar.info(...args)
      : console.info("---", ...args);
  };

  warn = (...args: LogArgument[]) => {
    // RN Rollbar uses `.warning`.
    return this.rollbar
      ? this.rollbar.warning(...args)
      : console.warn("---", ...args);
  };

  error = (...args: LogArgument[]) => {
    return this.rollbar
      ? this.rollbar.error(...args)
      : console.error("---", ...args);
  };

  setPerson = (id: string, name: string, email: string) => {
    if (this.rollbar) {
      this.rollbar.setPerson(id, name, email);
    } else {
      this.info(`Setting Logging User`, { id, name, email });
    }
  };

  clearPerson = () => {
    if (this.rollbar) {
      this.rollbar.clearPerson();
    } else {
      this.info("Unsetting Logging User");
    }
  };
}

export const logger = new Logger(rollbar);

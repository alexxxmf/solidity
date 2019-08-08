declare module "rollbar-react-native" {
  import Rollbar, { Configuration as JsConfiguration } from "rollbar";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

  export class Client {
    constructor(options?: Configuration);
    setPerson(id: string, name: string, email: string): void;
    clearPerson(): void;
    captureUncaughtExceptions(): void;
    captureUnhandledRejections(): void;
    log: Rollbar["log"];
    debug: Rollbar["debug"];
    info: Rollbar["info"];
    warning: Rollbar["warning"];
    error: Rollbar["error"];
    critical: Rollbar["critical"];
  }
  export class Configuration extends JsConfiguration {
    constructor(
      accessToken: string,
      options: Omit<JsConfiguration, "accessToken">
    );
  }
}

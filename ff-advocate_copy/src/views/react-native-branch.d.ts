declare module "react-native-branch" {
  declare const branch: {
    subscribe: (
      callback: (args: {
        error: string;
        params: {
          "+clicked_branch_link"?: boolean;
          token?: string;
          cached_initial_event?: boolean;
        };
      }) => void | Promise<void>
    ) => () => void;
    logout: () => void;
  };

  export default branch;
}

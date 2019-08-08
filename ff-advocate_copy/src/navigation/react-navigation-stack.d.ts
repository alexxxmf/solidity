declare module "react-navigation-stack" {
  import {
    NavigationTransitionProps,
    TransitionConfig
  } from "react-navigation";
  export const StackViewStyleInterpolator = {
    forHorizontal: (props: NavigationTransitionProps) => TransitionConfig
  };
}

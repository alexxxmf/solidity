import { Colors, Metrics, Fonts } from "../themes";

export const tabNavigatorConfig = {
  tabBarOptions: {
    activeTintColor: Colors.blue,
    inactiveTintColor: Colors.gray,
    labelStyle: {
      ...Fonts.style.navigationTabs
    },
    style: {
      backgroundColor: Colors.white,
      paddingBottom: Metrics.smallMargin,
      paddingTop: Metrics.baseMargin,
      height: 62
    }
  }
};

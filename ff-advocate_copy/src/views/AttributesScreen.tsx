import React, { Component } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import { Metrics, Images } from "../themes";
import ApplicationStyles from "./styles/ApplicationStyles";
import { Card } from "./styles/CardStyle";
import fwmAttributes, { FwmAttributeDescription } from "../data/fwm_attributes";
import attributesIcons from "../themes/Images";
import AttributesIntro from "./components/profile/AttributesIntro";
import AnalyticsContext, { AnalyticsContextValue } from "./AnalyticsContext";
import { CompletedProfileAppScreenProps } from "../types";
import { onAttributeExplored } from "./AnalyticsProvider";
import { navigateToAttributeDetailScreen } from "../navigation/HomeNavigation";

type PropsNoContext = {
  screenProps: CompletedProfileAppScreenProps;
} & NavigationInjectedProps<{}>;

type Props = PropsNoContext & {
  context: AnalyticsContextValue;
};

class AttributesScreen extends Component<Props> {
  _renderAttribute = ({ item }: { item: FwmAttributeDescription }) => {
    return (
      <TouchableOpacity
        style={styles.columns}
        key={item.url_friendly_name}
        onPress={() => {
          const data = { attribute: item.url_friendly_name };
          onAttributeExplored(this.props.context, item.id, data);
          navigateToAttributeDetailScreen(this.props.navigation, {
            attribute: item
          });
        }}
      >
        <Card style={styles.attributeBox}>
          <Image source={attributesIcons[item.icon]} />
          <Text style={ApplicationStyles.sectionDescription}>
            {item.attribute_name}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <View style={ApplicationStyles.mainContainer}>
        <ImageBackground
          source={Images.profileBg}
          style={ApplicationStyles.imageBackground}
        >
          <View
            style={[
              ApplicationStyles.sectionContainer,
              styles.sectionContainer
            ]}
          >
            <AttributesIntro />
            <FlatList
              data={fwmAttributes}
              keyExtractor={(item, index) => `${index}`}
              renderItem={this._renderAttribute}
              numColumns={2}
              horizontal={false}
            />
          </View>
        </ImageBackground>
      </View>
    );
  }
}

export default withNavigation<PropsNoContext>(props => (
  <AnalyticsContext.Consumer>
    {context => context && <AttributesScreen {...props} context={context} />}
  </AnalyticsContext.Consumer>
));

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1
  },
  columns: {
    flex: 1 / 2,
    margin: Metrics.smallMargin
  },
  attributeBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: Metrics.smallPadding
  }
});

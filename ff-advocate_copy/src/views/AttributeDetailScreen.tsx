import React, { Component } from "react";
import { StyleSheet, View, Text, ImageBackground, Image } from "react-native";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import { Colors, Fonts, Metrics, Images } from "../themes";
import attributeIcon from "../themes/Images";
import ApplicationStyles from "./styles/ApplicationStyles";
import { Card } from "./styles/CardStyle";
import AttributesIntro from "./components/profile/AttributesIntro";
import { logger } from "../utils/logging";

type AttributeIcons = keyof typeof attributeIcon;

export interface AttributeDetailScreenParams {
  attribute: {
    icon: AttributeIcons;
    attribute_name: string;
    what_is_it: string;
    why_develop_it: string;
  };
}

type Props = {} & NavigationInjectedProps<AttributeDetailScreenParams>;

class AttributeDetailScreen extends Component<Props> {
  render() {
    const attribute = this.props.navigation.getParam("attribute");

    if (!attribute) {
      logger.warn(`No attribute in attribute navigation params.`);
      return null;
    }

    return (
      <View style={ApplicationStyles.mainContainer}>
        <ImageBackground
          source={Images.profileBg}
          style={ApplicationStyles.imageBackground}
        >
          <View style={ApplicationStyles.sectionContainer}>
            <AttributesIntro />
            <Card>
              <View style={styles.attributeHeader}>
                <Image
                  style={styles.iconImage}
                  source={attributeIcon[attribute.icon]}
                />
                <View style={styles.attributeHeaderContent}>
                  <Text style={styles.titleText}>
                    {attribute.attribute_name}
                  </Text>
                  <Text style={[styles.descriptionText]}>
                    {attribute.what_is_it}
                  </Text>
                </View>
              </View>
              <Text style={[styles.questionText]}>Why develop it?</Text>
              <Text style={[styles.descriptionText]}>
                {attribute.why_develop_it}
              </Text>
            </Card>
          </View>
        </ImageBackground>
      </View>
    );
  }
}

export default withNavigation<Props>(props => (
  <AttributeDetailScreen {...props} />
));

const styles = StyleSheet.create({
  attributeHeader: {
    flexDirection: "row",
    marginBottom: Metrics.baseMargin
  },
  attributeHeaderContent: {
    flex: 1,
    paddingLeft: Metrics.baseMargin
  },
  titleText: {
    ...Fonts.style.sectionHeaderSmall,
    fontWeight: "bold",
    color: Colors.black
  },
  questionText: {
    fontSize: Fonts.size.small,
    fontFamily: Fonts.family.name,
    fontWeight: "bold",
    marginBottom: Metrics.smallMargin
  },
  descriptionText: {
    fontSize: Fonts.size.small,
    fontFamily: Fonts.family.name,
    marginBottom: Metrics.doubleBaseMargin,
    color: Colors.grayDark
  },
  iconImage: {
    width: Metrics.images.xlarge,
    height: Metrics.images.xlarge
  }
});

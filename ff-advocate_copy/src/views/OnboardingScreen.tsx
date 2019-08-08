/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Component } from "react";
import { Image, Text, View, StyleSheet } from "react-native";
import {
  NavigationInjectedProps,
  NavigationParams,
  withNavigation
} from "react-navigation";
import Carousel, { Pagination } from "react-native-snap-carousel";
import Button from "./components/Button";
import { Metrics, Colors, Fonts, Images } from "../themes";
import Config from "react-native-config";
import { AppScreenProps } from "../types";
import { logger } from "../utils/logging";

type Props = {
  screenProps: AppScreenProps;
} & NavigationInjectedProps<NavigationParams>;

interface State {
  slider1ActiveSlide: number;
}

interface SlideItem {
  title: string;
  description: string;
  illustration: keyof typeof Images;
}

const SLIDES: SlideItem[] = [
  {
    title: "Learn new skills",
    description:
      "Get ready to host a session and find out more about the topics using the prepare mode.",
    illustration: "prepare"
  },
  {
    title: "Share your knowledge",
    description:
      "When you are ready to host a session, use the deliver mode to access simple notes to keep you on track.",
    illustration: "deliver"
  },
  {
    title: "Customize your experience",
    description:
      "Update your details and find out what skills are needed for the future using your profile.",
    illustration: "profile"
  }
];

// TODO typing for refs on carousel are a bit all over the place. works tho!
// using anys to fudge working version into TS
export class OnboardingScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      slider1ActiveSlide: 0
    };
  }

  maybeNavigateToDefaultLoggedInScreen = () => {
    if (this.props.screenProps.userId) {
      // Actually, the user is logged in -- this can happen if reloading the app with a new persistence key.
      // We navigate to a default screen
      logger.info(
        "Navigating away from onboarding, onto default logged-in screen",
        this.props.screenProps
      );
      this.props.navigation.navigate("PrepareSessions");
    }
  };

  componentDidMount() {
    this.maybeNavigateToDefaultLoggedInScreen();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (this.props.screenProps.userId !== prevProps.screenProps.userId) {
      this.maybeNavigateToDefaultLoggedInScreen();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _slider1Ref: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _carousel: any;

  _renderItem({ item }: { item: SlideItem }) {
    return (
      <View style={styles.slideItem}>
        <View style={styles.slideItemInner}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
          <Image
            source={Images[item.illustration]}
            style={styles.slideIllustration}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  render() {
    const { slider1ActiveSlide } = this.state;

    // As this is the usual entry-point for E2E testing, we offer a safety net through this view.
    let isE2eTest = false;
    try {
      isE2eTest = JSON.parse(Config.IS_E2E_TEST);
    } catch (e) {
      isE2eTest = false;
    }

    return (
      <View style={styles.mainContainer}>
        <Carousel<SlideItem>
          testID={
            isE2eTest ? "onboardingCarousel" : "onboardingCarouselOutsideE2e"
          }
          ref={(c: any) => {
            this._carousel = c;
          }}
          layout={"default"}
          data={SLIDES}
          renderItem={this._renderItem}
          sliderWidth={Metrics.screenWidth - Metrics.tripleBaseMargin * 2}
          itemWidth={Metrics.screenWidth - Metrics.tripleBaseMargin * 2}
          onSnapToItem={(index: number) =>
            this.setState({ slider1ActiveSlide: index })
          }
          containerCustomStyle={styles.carouselContainer}
          contentContainerStyle={styles.contentContainerStyle}
        />
        <Pagination
          dotsLength={SLIDES.length}
          activeDotIndex={slider1ActiveSlide}
          containerStyle={styles.paginationContainer}
          dotColor={Colors.white}
          dotStyle={styles.dotStyle}
          inactiveDotColor={Colors.grayLight}
          inactiveDotOpacity={0.4}
          inactiveDotScale={0.6}
          carouselRef={this._slider1Ref}
          tappableDots={!!this._slider1Ref}
        />
        <View style={styles.buttonContainer}>
          <Button
            testID="goToSignIn"
            title="Skip the introduction"
            onPress={() =>
              this.props.navigation.navigate("OnboardingSignInScreen")
            }
          />
        </View>
      </View>
    );
  }
}

function illustrationSize() {
  return Metrics.screenHeight > Metrics.screenHeightSmallDevices
    ? Metrics.images.xxlarge
    : Metrics.images.xlarge;
}

function slideItemPosition() {
  return Metrics.screenHeight > Metrics.screenHeightSmallDevices
    ? Metrics.screenHeight * 0.1
    : Metrics.doubleBaseMargin;
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Metrics.doubleBaseMargin
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.white,
    lineHeight: 35,
    marginBottom: Metrics.baseMargin
  },
  slideDescription: {
    ...Fonts.style.sectionHeaderSmall,
    color: Colors.white,
    lineHeight: 30
  },
  carouselContainer: {
    paddingTop: slideItemPosition()
  },
  contentContainerStyle: {
    alignItems: "center"
  },
  slideItem: {
    paddingTop: slideItemPosition()
  },
  slideItemInner: {
    justifyContent: "center"
  },
  slideIllustration: {
    height: illustrationSize(),
    width: illustrationSize()
  },
  dotStyle: {
    width: 20,
    height: 20
  },
  paginationContainer: {
    paddingVertical: 8
  },
  buttonContainer: {
    justifyContent: "center",
    flex: 1,
    padding: 20
  }
});

export default withNavigation(OnboardingScreen);

# ff-advocate &middot; [![CircleCI](https://circleci.com/gh/Freeformers/ff-advocate.svg?style=svg&circle-token=a29fc245bcb93a46a4a8807d6556ea941c588f5a)](https://circleci.com/gh/Freeformers/ff-advocate)

This project was bootstrapped with [react-native-cli](https://facebook.github.io/react-native/docs/getting-started.html).
If its your first time here you can read the [installation notes](docs/setup.md)

---

## Getting Started

    cp .env.sample .env
    yarn
    yarn run-<PLATFORM>

## Deploy workflow

Create a new branch and bump versions before opening your merge.

    git checkout -b feature/<FEATURE_NAME>
    yarn bump-ios
    yarn bump-android

CircleCI will automatically build and releases versions when you merge to `develop`

You can manually release new versions on the stores:

- iOS: `cd ios` and check [ios/README.md](ios/README.md)
- Android: `cd android` and check [android/README.md](android/README.md)

## Store testing workflow

Internal Beta test:

- iOS: https://digitalmentor.herokuapp.com/
  We can define a list on App Store Connect Users
- Android: https://play.google.com/apps/testing/com.freeformers.b2c.digitalmentor
  We can update the tester list on the next release (_Release management_ > _App release_ > _Manage_)

External Beta test:

- iOS: https://testflight.apple.com/join/5QryBl61
- Android: https://play.google.com/store/apps/details?id=com.freeformers.b2c.digitalmentor

Production:

- iOS: https://itunes.apple.com/fr/app/digital-mentor/id1436196513?l=en&mt=8
- Android: https://play.google.com/store/apps/details?id=com.freeformers.b2c.digitalmentor

### Debug on real iOS devices

Open [ios/fastlane/fastfile](ios/fastlane/fastfile), add the [UUID of your device](http://whatsmyudid.com/) and run:

    fastlane add_device
    fastlane match development --force

## Generating Source Maps

It takes some time, so relax and be patient...

- iOS: `react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios-release.bundle --sourcemap-output ios-release.bundle.map --sourcemap-sources-root ./`

- Android: `react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-release.bundle --sourcemap-output android-release.bundle.map --sourcemap-sources-root ./`

It basically creates a bundle file and based on that the source map. After this you can send the source map wherever is needed and remove both files.

This is how we upload source maps into rollbar

```
  curl https://api.rollbar.com/api/1/sourcemap \
   -F access_token={key_here} \
   -F version=260 \
   -F minified_url=http://reactnativehost/main.jsbundle \
   -F source_map=@sourcemap.ios.js.map \
   -F index.js=@index.js
```

## Running E2E tests

E2E tests are built using [Detox](https://github.com/wix/Detox/tree/master/docs). They can be ran manually, and are part of the CI process. They use the `.env.e2e` configuration, and screenshots as well as a video are exported to the `artifacts` folder.

A tip is that if switching between platforms to run tests on, it's generally best to stop the bundler.

#### E2E on CircleCI

On CI, only the E2E tests for iPhone are ran -- Android emulator is not supported on CircleCI, and if not running multi-platform, there's not much benefit to running multi-form-factor (iPad).

In addition E2E tests are only ran automatically on commits/merges to the `develop` branch.

### Android

Tested using Android Studio emulator

1. Run `yarn e2e:android:build` once (creates native app)
2. Make sure bundler is running if not already (`yarn start`)
3. Run `yarn e2e:android:test` (launches emulated Pixel 3 and runs tests)

### iOS

Tested iPhone X XCode simulator. If you want to see what's going on, pre-launch the iPhone X simulator.

1. Run `yarn e2e:ios:build` once (creates native app)
2. Make sure bundler is running if not already (`yarn start`)
3. Run `yarn e2e:ios:test` (uses open simulator or launches a headless simulator, runs tests)

#### iPad

We also support iPad (iPad Pro, 12.9inch, 3rd gen). Instructions as per iOS, using `yarn e2e:ipad:build` and `yarn e2e:ipad:test`

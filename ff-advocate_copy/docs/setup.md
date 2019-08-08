# Setup your new machine

1. Install Xcode from the App Store
1. Run `xcode-select --install` to install development tools first.
1. Install [android development environment](https://github.com/facebook/react-native-website/blob/master/docs/getting-started.md#android-development-environment)
1. [Install fastlane](https://docs.fastlane.tools/#getting-started).
1. Install `applesimutils` for end 2 end testing with `brew install wix/brew/applesimutils`

## Codesigning for iOS

Check if everything is fine with

```console
cd ios
fastlane match appstore
```

If needed, open `1password secure notes` and look for `iOS Development - Credentials passphrase`

## Setup circleCI

If you have this error:

```console
[!] Could not find action, lane or variable 'setup_circle_ci'.
```

You can solve it with:

```console
cd ios
fastlane match development
```

If you are using ssh key and 2FA to sign in on GitHub, you need to create a Personnal access token https://github.com/settings/tokens/new

```console
[!] Error cloning certificates git repo, please make sure you have access to the repository - see instructions above
```

## [Keystore for Android](https://facebook.github.io/react-native/docs/signed-apk-android.html#setting-up-gradle-variables)

Open `1password secure notes` and look for `Android Development - Credentials`

Update your `~/.gradle/gradle.properties` file.

Add `ff-holdings-android-key.keystore` with what I upload below

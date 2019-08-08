fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## iOS
### ios export_build_number
```
fastlane ios export_build_number
```
Export build number as ENV variable
### ios add_device
```
fastlane ios add_device
```
Register new devices to build/test/debug from Xcode
### ios check_build_number_versus_testflight
```
fastlane ios check_build_number_versus_testflight
```
Check that the current build number is higher than the one in Testflight
### ios release_to_beta
```
fastlane ios release_to_beta
```
Submit a new Beta Build to Apple TestFlight

This will also make sure the profile is up to date
### ios bump_patch
```
fastlane ios bump_patch
```
Bump patch
### ios bump_minor
```
fastlane ios bump_minor
```
Bump minor
### ios bump_major
```
fastlane ios bump_major
```
Bump major
### ios bump_build
```
fastlane ios bump_build
```
Bump build
### ios beta
```
fastlane ios beta
```
Push a new beta build to TestFlight
### ios makeicons
```
fastlane ios makeicons
```

### ios screenshots
```
fastlane ios screenshots
```
Screenshot application and upload to App Store
### ios check_current_greater_than_live_version
```
fastlane ios check_current_greater_than_live_version
```
Check that the current application version is not the same as the published live one

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

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
## Android
### android check_version_code_versus_playstore
```
fastlane android check_version_code_versus_playstore
```
Check that the current version code is higher than the one in Play Store Alpha track
### android bump_version_code
```
fastlane android bump_version_code
```
Bump version code
### android release_to_alpha
```
fastlane android release_to_alpha
```
Build, Sign and Submit a new build to the Play Store

This build will be added to the Alpha closed release track
### android export_build_number
```
fastlane android export_build_number
```
Export build number as ENV variable
### android makeicons
```
fastlane android makeicons
```
Update Android app icons and launcher images
### android beta
```
fastlane android beta
```
Deploy a new beta version to the Google Play store
### android justsupply
```
fastlane android justsupply
```

### android internal
```
fastlane android internal
```
Deploy a new INTERNAL version to the Google Play store
### android justsupplyinternal
```
fastlane android justsupplyinternal
```


----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLinkingManager.h>
#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNSplashScreen.h"
#import "ReactNativeConfig.h"
#import <react-native-branch/RNBranch.h>
#import "Intercom/intercom.h"
#import <RollbarReactNative/RollbarReactNative.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Uncomment this line to use the test key instead of the live one.
  // [RNBranch useTestInstance];
  [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES]; // <-- add this

  NSString *useRollbarEnv = [ReactNativeConfig envFor:@"USE_ROLLBAR"];
  NSString *rollbarApiKey = [ReactNativeConfig envFor:@"ROLLBAR_CLIENT_TOKEN"];
  BOOL rollbarKeyHasLength = rollbarApiKey.length > 4;
  BOOL useRollbar = [useRollbarEnv isEqualToString:@"true"];
  if (useRollbar && rollbarKeyHasLength) {
    [RollbarReactNative initWithAccessToken:rollbarApiKey];
  }

  NSURL *jsCodeLocation;
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"digitalmentor"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  [RNSplashScreen show];

  NSString *intercomApiKey = [ReactNativeConfig envFor:@"INTERCOM_IOS_API_KEY"];
  NSString *intercomAppId = [ReactNativeConfig envFor:@"INTERCOM_APP_ID"];

  [Intercom setApiKey:intercomApiKey forAppId:intercomAppId];
  [Intercom registerUnidentifiedUser];
  return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if (![RNBranch.branch application:app openURL:url options:options]) {
    // do other deep link routing for the Facebook SDK, Pinterest SDK, etc
  }
  return YES;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *) userActivity restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler {
  return [RNBranch continueUserActivity:userActivity];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  // Intercom Push Notifications
  [Intercom setDeviceToken:deviceToken];
}
@end

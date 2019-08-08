package com.freeformers.b2c.digitalmentor;

import android.app.Application;

import com.airbnb.android.react.lottie.LottiePackage;
import com.avishayil.rnrestart.ReactNativeRestartPackage;
import com.facebook.react.modules.email.EmailPackage;
import com.facebook.react.ReactApplication;
import com.corbt.keepawake.KCKeepAwakePackage;
import com.rollbar.RollbarReactNative;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.robinpowered.react.Intercom.IntercomPackage;
import com.tron.ReactNativeWheelPickerPackage;
import io.branch.referral.Branch;
import io.branch.rnbranch.RNBranchPackage;
import io.github.traviskn.rnuuidgenerator.RNUUIDGeneratorPackage;
import io.intercom.android.sdk.Intercom;
import org.devio.rn.splashscreen.SplashScreenReactPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new AsyncStoragePackage(),
        new EmailPackage(),
        new IntercomPackage(),
        new LottiePackage(),
        new MainReactPackage(),
            new KCKeepAwakePackage(),
            RollbarReactNative.getPackage(),
        new ReactNativeConfigPackage(),
        new ReactNativeRestartPackage(),
        new ReactNativeWheelPickerPackage(),
        new RNBranchPackage(),
        new RNCWebViewPackage(),
        new RNDeviceInfo(),
        new RNUUIDGeneratorPackage(),
        new SplashScreenReactPackage(),
        new VectorIconsPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    String USE_ROLLBAR = new String(BuildConfig.USE_ROLLBAR);
    String ROLLBAR_API_KEY = new String(BuildConfig.ROLLBAR_CLIENT_TOKEN);
    if (USE_ROLLBAR.equals("true") && ROLLBAR_API_KEY.length() > 4) {
      RollbarReactNative.init(this, ROLLBAR_API_KEY, "production");
    }
    SoLoader.init(this, /* native exopackage */ false);

    Branch.getAutoInstance(this);

    String API_KEY = new String(BuildConfig.INTERCOM_ANDROID_API_KEY);
    String APP_ID = new String(BuildConfig.INTERCOM_APP_ID);
    Intercom.initialize(this, API_KEY, APP_ID);
  }
}

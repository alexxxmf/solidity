/* eslint-disable */
describe('Sign in Flow - Actions', () => {
  it('should have onboarding screen & tap Skip the introduction button', async () => {
    await device.reloadReactNative(); // start state for app
    await expect(
      element(
        by.text(
          'Get ready to host a session and find out more about the topics using the prepare mode.'
        )
      )
    ).toBeVisible();

    await device.takeScreenshot('loaded into onboarding');

    // Note 'onboardingCarousel' only exists in E2E test mode, to ensure correct `.env.e2e` is applied.
    await element(by.id('onboardingCarousel')).swipe('left');
    await device.takeScreenshot('carousel pg 2');

    await element(by.id('onboardingCarousel')).swipe('left');
    await device.takeScreenshot('carousel pg 3');

    await element(by.id('goToSignIn')).tap();
  });

  it('should have sign up screen & tap Send link button', async () => {
    await element(by.id('userEmailOnboarding')).tap();
    await element(by.id('userEmailOnboarding')).typeText('test@test.com\n');
    await element(by.id('goToPending')).tap();
  });
});

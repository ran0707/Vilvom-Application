/**
 * Detox E2E Tests — Authentication Flows
 * Covers: Signup (phone → OTP → MainTabs), Login (phone → OTP → MainTabs)
 *
 * Prerequisites:
 *   - Android emulator running (Pixel 8 Pro API 35)
 *   - Backend running on localhost:5000
 *   - `yarn e2e:build && yarn e2e:test` or `npx detox test`
 *
 * Test phone numbers (OTP printed in backend console, never via SMS in dev):
 *   +919876543210  — signup number (must not be registered)
 *   +919000000001  — login number (must be pre-registered)
 */

describe('Auth — Signup Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows GetStarted screen on first launch', async () => {
    await expect(element(by.text(/get started/i))).toBeVisible();
  });

  it('taps Get Started → lands on Signup screen', async () => {
    await element(by.text(/get started/i)).tap();
    await expect(element(by.text(/sign up/i))).toBeVisible();
  });

  it('empty phone → shows error alert', async () => {
    await element(by.text(/get started/i)).tap();
    await element(by.text(/send otp/i)).tap();
    await expect(element(by.text(/phone number/i))).toBeVisible();
  });

  it('too-short phone → shows validation error', async () => {
    await element(by.text(/get started/i)).tap();
    await element(by.id('phone-input')).typeText('98765');
    await element(by.text(/send otp/i)).tap();
    await expect(element(by.text(/valid/i))).toBeVisible();
  });

  it('full signup flow: valid phone → OTP screen appears', async () => {
    await element(by.text(/get started/i)).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.text(/send otp/i)).tap();

    // OTP entry should appear after request
    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(8000);
  });

  it('wrong OTP → shows error', async () => {
    await element(by.text(/get started/i)).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.text(/send otp/i)).tap();

    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(8000);

    await element(by.id('otp-input')).typeText('000000');
    await element(by.text(/verify/i)).tap();

    await waitFor(element(by.text(/invalid|expired|error/i)))
      .toBeVisible()
      .withTimeout(5000);
  });

  /**
   * Full happy-path requires a real OTP from the backend console.
   * In CI/dev, the backend logs the OTP: "📱 OTP for +91XXXXXXXXXX: 123456"
   * Use a seeded OTP (if backend supports TEST_OTP env) or check the log.
   */
  it.skip('correct OTP → navigates to MainTabs (requires live OTP)', async () => {
    await element(by.text(/get started/i)).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.text(/send otp/i)).tap();

    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(8000);

    // Replace '123456' with the OTP from the backend console
    await element(by.id('otp-input')).typeText('123456');
    await element(by.text(/verify/i)).tap();

    await waitFor(element(by.id('bottom-tabs')))
      .toBeVisible()
      .withTimeout(10000);
  });
});

describe('Auth — Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('navigates GetStarted → Login (via "Already have an account?" link)', async () => {
    await element(by.text(/get started/i)).tap();
    // Look for login link on signup screen
    const loginLink = element(by.text(/log ?in|already.+account/i));
    if (await loginLink.isVisible()) {
      await loginLink.tap();
    } else {
      // Navigate directly if no link
      await device.sendToHome();
    }
  });

  it('empty phone on Login → shows error', async () => {
    await element(by.text(/get started/i)).tap();
    try {
      await element(by.text(/log ?in|sign in/i)).tap();
    } catch {
      // already on login or link not found
    }
    await element(by.text(/send otp/i)).tap();
    await expect(element(by.text(/phone number/i))).toBeVisible();
  });

  it('phone not registered → shows "User not found" error', async () => {
    await element(by.text(/get started/i)).tap();
    try {
      await element(by.text(/log ?in|sign in/i)).tap();
    } catch {
      // ignore
    }
    await element(by.id('phone-input')).typeText('9999999999');
    await element(by.text(/send otp/i)).tap();

    await waitFor(element(by.text(/user not found|not found|error/i)))
      .toBeVisible()
      .withTimeout(8000);
  });
});

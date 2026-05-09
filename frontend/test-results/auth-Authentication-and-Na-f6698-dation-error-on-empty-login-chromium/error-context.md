# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication and Navigation >> should show validation error on empty login
- Location: tests\auth.spec.ts:39:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /login|sign in/i })
    - locator resolved to <button disabled type="submit">Sign In →</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    52 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: ✨ Welcome to Navacle Report Studio - The ultimate dynamic query framework for enterprise reporting ✨🚀 131+ Endpoints available · Real-time JSON Mapping · Instant Excel Export 🚀💎 Premium Design System Active · New Dashboard Personalization Enabled 💎
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]: "N"
          - generic [ref=e10]: Navacle Report Studio
        - heading "Welcome Back." [level=1] [ref=e11]:
          - text: Welcome
          - text: Back.
        - paragraph [ref=e12]: Sign in to access your reports, schedules and analytics — all in one place.
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]: 📊
            - generic [ref=e16]: Real-time dynamic report builder
          - generic [ref=e17]:
            - generic [ref=e18]: 🔒
            - generic [ref=e19]: Secure session management
          - generic [ref=e20]:
            - generic [ref=e21]: ⚡
            - generic [ref=e22]: 131 cloud query endpoints
      - generic [ref=e24]:
        - generic [ref=e25]:
          - heading "Welcome back 👋" [level=2] [ref=e26]
          - paragraph [ref=e27]: Sign in to your Navacle account
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: Email Address
            - textbox "you@company.com" [ref=e31]
          - generic [ref=e32]:
            - generic [ref=e33]: Password
            - generic [ref=e34]:
              - textbox "••••••••" [ref=e35]
              - button "👁️" [ref=e36] [cursor=pointer]
          - button "Sign In →" [disabled] [ref=e37]
        - generic [ref=e38]:
          - text: Don't have an account?
          - link "Create one" [ref=e39] [cursor=pointer]:
            - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e45] [cursor=pointer]:
    - img [ref=e46]
  - alert [ref=e49]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication and Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('should load the landing page with correct title', async ({ page }) => {
  9  |     // Check if the page title contains Navacle
  10 |     await expect(page).toHaveTitle(/Navacle/);
  11 |   });
  12 | 
  13 |   test('should have login form elements', async ({ page }) => {
  14 |     // Check for email and password inputs
  15 |     const emailInput = page.locator('input[type="email"], input[name="email"]');
  16 |     const passwordInput = page.locator('input[type="password"], input[name="password"]');
  17 |     
  18 |     // We expect at least one of these to be visible if it's a login page
  19 |     // Note: Since we are testing a live site, we'll be flexible with selectors
  20 |     await expect(emailInput.first()).toBeVisible();
  21 |     await expect(passwordInput.first()).toBeVisible();
  22 |   });
  23 | 
  24 |   test('should navigate to signup page', async ({ page }) => {
  25 |     // Look for a link that mentions signing up
  26 |     const signupLink = page.getByRole('link', { name: /sign up|register/i });
  27 |     
  28 |     if (await signupLink.isVisible()) {
  29 |       await signupLink.click();
  30 |       await expect(page).toHaveURL(/signup|register/);
  31 |       
  32 |       // Check for common signup fields
  33 |       await expect(page.locator('input[name="name"], input[placeholder*="Name"i]').first()).toBeVisible();
  34 |     } else {
  35 |       console.log('Signup link not found on landing page, skipping navigation check.');
  36 |     }
  37 |   });
  38 | 
  39 |   test('should show validation error on empty login', async ({ page }) => {
  40 |     const loginButton = page.getByRole('button', { name: /login|sign in/i });
  41 |     
  42 |     if (await loginButton.isVisible()) {
> 43 |       await loginButton.click();
     |                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  44 |       
  45 |       // Check for validation messages or if we stay on the same page
  46 |       // Many modern apps use HTML5 validation or custom toast messages
  47 |       await expect(page).toHaveURL('/');
  48 |     }
  49 |   });
  50 | });
  51 | 
```
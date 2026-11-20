import { expect, test } from '@playwright/test'

const loginEmail = process.env.E2E_AUTH_LOGIN_EMAIL?.trim()
const loginPassword = process.env.E2E_AUTH_LOGIN_PASSWORD?.trim()

test.describe('auth smoke', () => {
  test('@smoke account page renders auth controls', async ({ page }) => {
    await page.goto('/account')

    await expect(page.getByTestId('account-dashboard')).toBeVisible()
    await expect(page.getByTestId('account-login-form')).toBeVisible()
    await expect(page.locator('#login-email')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
    await expect(page.getByTestId('account-switch-create')).toBeVisible()
  })

  test('@smoke admin upcoming page renders', async ({ page }) => {
    await page.goto('/admin/upcoming')

    await expect(page.getByRole('heading', { name: 'Upcoming stations' })).toBeVisible()
  })

  test('@smoke existing account can log in when smoke credentials are configured', async ({
    page,
  }) => {
    test.skip(!loginEmail || !loginPassword, 'E2E auth smoke credentials are not configured.')

    await page.goto('/account')
    await page.locator('#login-email').fill(loginEmail!)
    await page.locator('#login-password').fill(loginPassword!)
    await page.getByTestId('account-login-submit').click()

    await expect(page.getByTestId('account-authenticated-panel')).toBeVisible()
    await expect(page.getByText(loginEmail!, { exact: false })).toBeVisible()
  })
})

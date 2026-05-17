import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { OnboardingPageObject } from '../pages/OnboardingPageObject'

test.describe('Onboarding flow', () => {
  test('saves project root path and routes to workspace', async ({ page }) => {
    await installApiMocks(page, {
      onboardingStatus: {
        configured: false,
        projects_root_path: null,
        model_storage_path: null,
        default_projects_root_path: '/tmp/tailflow-projects',
        default_model_storage_path: '/tmp/models',
      },
    })

    const onboardingPage = new OnboardingPageObject(page)

    await onboardingPage.goto()
    await onboardingPage.saveProjectsRootPath('/tmp/tailflow-projects')

    await expect(page).toHaveURL(/\/workspace/)
    await expect(page.getByText('Current project')).toBeVisible()
  })
})

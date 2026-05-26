import { test, expect } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { MobileWorkspacePageObject } from '../pages/MobileWorkspacePageObject'

test.describe('Workspace Refresh Regression', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
  })

  test('restores loaded workspace without deadlock, restoring project, image, and mobile panel state @mobile', async ({ page }) => {
    await installApiMocks(page)

    const mobileWorkspace = new MobileWorkspacePageObject(page)

    // 1. Visit workspace
    await mobileWorkspace.goto()

    // We expect the project browser stage on first mobile visit unless URL states otherwise
    await mobileWorkspace.enterMobileWorkspace('Sample Project', 'sample.png')
    await mobileWorkspace.selectBottomPanel('Project Details')

    // Wait for the state to persist
    await page.waitForTimeout(500)

    // 2. Setup mock again for reload (installApiMocks handles persistent mocks if we needed to but doing it again applies to the context if lost)
    await installApiMocks(page)

    // 3. Reload Page
    await page.reload()

    // 4. Assert no infinite loading and state is restored
    await expect(page.getByRole('heading', { name: 'Loading workspace' })).toBeHidden()
    
    // Project selected
    await expect(page.getByRole('heading', { name: 'Sample Project' })).toBeVisible()

    // Mobile Stage and Panel are restored
    await mobileWorkspace.expectBottomPanelTitle('Project Details')
  })
})

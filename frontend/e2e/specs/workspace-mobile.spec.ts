import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { MobileWorkspacePageObject } from '../pages/MobileWorkspacePageObject'

test.describe('Workspace mobile mode switching', () => {
  test('navigates project browser to image browser to mobile workspace @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.enterMobileWorkspace('Sample Project', 'sample.png')
    await workspace.expectBottomPanelTitle('Current Tags')
  })

  test('switches bottom panel using menu in mobile workspace @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.enterMobileWorkspace('Sample Project', 'sample.png')

    await workspace.selectBottomPanel('AI Proposed Tags')
    await workspace.expectBottomPanelTitle('AI Proposed Tags')

    await workspace.selectBottomPanel('Project Details')
    await workspace.expectBottomPanelTitle('Project Details')
  })
})

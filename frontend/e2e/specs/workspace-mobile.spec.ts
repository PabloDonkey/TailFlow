import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { MobileWorkspacePageObject } from '../pages/MobileWorkspacePageObject'

test.describe('Workspace mobile mode switching', () => {
  test('opens mobile tags panel from quick actions @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })

  test('in mobile inspector view, quick actions open drawer for browse inspect and tags @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.closeImageCanvas()
    await workspace.chooseTaggingFromProjectBrowser('Sample Project')

    await workspace.openMobilePanel('Browse')
    await workspace.expectMobilePanelTitle('Image Browser')
    await workspace.expectImageVisibleInBrowser('sample.png')
    await workspace.closeMobilePanel()

    await workspace.openMobilePanel('Inspect')
    await workspace.expectMobilePanelTitle('Current Tags')
    await workspace.closeMobilePanel()

    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })
})

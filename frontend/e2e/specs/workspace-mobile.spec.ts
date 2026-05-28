import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { MobileWorkspacePageObject } from '../pages/MobileWorkspacePageObject'

test.describe('Workspace mobile mode switching', () => {
  test('navigates project browser to image browser to mobile workspace @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.enterMobileWorkspace('Sample Project', 'sample-1.png')
    await workspace.expectBottomPanelTitle('Current Tags')
  })

  test('switches bottom panel using menu in mobile workspace @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.enterMobileWorkspace('Sample Project', 'sample-1.png')

    await workspace.selectBottomPanel('AI Proposed Tags')
    await workspace.expectBottomPanelTitle('AI Proposed Tags')

    await workspace.selectBottomPanel('Project Details')
    await workspace.expectBottomPanelTitle('Project Details')
  })
})

test.describe('Workspace mobile delete navigation', () => {
  test('deletes non-last image and loads next image @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    // sort order: sample-1.png (0), sample-2.png (1), sample-3.png (2)
    await workspace.enterMobileWorkspace('Sample Project', 'sample-2.png')
    await workspace.deleteCurrentImage()
    await workspace.expectCanvasImageWithFilename('sample-3.png')
  })

  test('deletes last image and loads previous image @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    // sort order: sample-1.png (0), sample-2.png (1), sample-3.png (2)
    await workspace.enterMobileWorkspace('Sample Project', 'sample-3.png')
    await workspace.deleteCurrentImage()
    await workspace.expectCanvasImageWithFilename('sample-2.png')
  })

  test('deletes only image and shows canvas empty state @mobile', async ({ page }) => {
    await installApiMocks(page, { imageCount: 1 })

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.enterMobileWorkspace('Sample Project', 'sample-1.png')
    await workspace.deleteCurrentImage()
    await workspace.expectCanvasEmptyState()
  })
})

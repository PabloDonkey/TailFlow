import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { WorkspacePageObject } from '../pages/WorkspacePageObject'

test.describe('Workspace mode switching', () => {
  test('switches between projects, tags library, and inspector @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()

    await workspace.openActionsMenu()
    await workspace.showProjectsMode()

    await workspace.openActionsMenu()
    await workspace.showTagsLibraryMode()

    await workspace.openActionsMenu()
    await workspace.showTagInspectorMode()
  })

  test('opens mobile tags panel from quick actions @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })

  test('keeps quick actions hidden in desktop layout @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.expectDesktopQuickActionsHidden()
  })
})

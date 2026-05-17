import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { WorkspacePageObject } from '../pages/WorkspacePageObject'

test.describe('Workspace mode switching', () => {
  test('switches between projects, tags library, and inspector', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()

    await workspace.openActionsMenu()
    await workspace.expectActionsOptionSelected('inspector')
    await workspace.showProjectsMode()

    await workspace.openActionsMenu()
    await workspace.expectActionsOptionSelected('projects')
    await workspace.showTagsLibraryMode()

    await workspace.openActionsMenu()
    await workspace.expectActionsOptionSelected('tags')
    await workspace.showTagInspectorMode()

    await workspace.openActionsMenu()
    await workspace.expectActionsOptionSelected('inspector')
  })

  test('opens mobile tags panel from quick actions @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })

  test('in mobile inspector view, quick actions open drawer for browse inspect and tags @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.showTagInspectorMode()

    await workspace.openMobilePanel('Browse')
    await workspace.expectMobilePanelTitle('Image Browser')
    await workspace.closeMobilePanel()

    await workspace.openMobilePanel('Inspect')
    await workspace.expectMobilePanelTitle('Tag Inspector')
    await workspace.closeMobilePanel()

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

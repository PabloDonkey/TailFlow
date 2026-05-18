import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { WorkspaceCanvasProjectBrowserPageObject } from '../pages/WorkspaceCanvasProjectBrowserPageObject'

test.describe('Workspace canvas and project browser transitions', () => {
  test('selecting a project in Project Browser hides Project Browser and shows Canvas', async ({ page }) => {
    await installApiMocks(page)
    const workspace = new WorkspaceCanvasProjectBrowserPageObject(page)

    await workspace.goto()
    await workspace.ensureProjectBrowserMode()
    await workspace.selectProject('Sample Project')
    await workspace.expectCanvasVisible()
    await workspace.expectProjectBrowserHidden()
  })

  test('closing Canvas shows Project Browser and hides all other cards', async ({ page }) => {
    await installApiMocks(page)
    const workspace = new WorkspaceCanvasProjectBrowserPageObject(page)

    await workspace.goto()
    await workspace.ensureProjectBrowserMode()
    await workspace.selectProject('Sample Project')
    await workspace.expectCanvasVisible()
    await workspace.closeCanvas()
    await workspace.expectProjectBrowserVisible()
    await workspace.expectNonProjectBrowserCardsHidden()
  })
})

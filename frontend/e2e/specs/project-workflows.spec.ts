import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { DesktopWorkspacePageObject } from '../pages/DesktopWorkspacePageObject'
import { MobileWorkspacePageObject } from '../pages/MobileWorkspacePageObject'

test.describe('Project and tagging workflows', () => {
  test('creates a project from project manager @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new MobileWorkspacePageObject(page)

    await workspace.goto()
    await workspace.closeImageCanvas()

    await workspace.openCreateProjectDialog()
    await workspace.createProject({
      folderName: 'cross-device-e2e-project-mobile',
      classTag: 'character',
      displayName: 'Cross Device E2E Project Mobile',
      triggerTag: 'cross_device_e2e_project_mobile',
    })

    await workspace.expectProjectVisible('Cross Device E2E Project Mobile')
  })

  test('creates a project from project manager @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new DesktopWorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.closeImageCanvas()

    await workspace.openCreateProjectDialog()
    await workspace.createProject({
      folderName: 'cross-device-e2e-project-desktop',
      classTag: 'character',
      displayName: 'Cross Device E2E Project Desktop',
      triggerTag: 'cross_device_e2e_project_desktop',
    })

    await workspace.expectProjectVisible('Cross Device E2E Project Desktop')
  })

  test('creates a project and uploads an image @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new DesktopWorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.closeImageCanvas()

    await workspace.openCreateProjectDialog()
    await workspace.createProject({
      folderName: 'e2e-project',
      classTag: 'character',
      displayName: 'E2E Project',
      triggerTag: 'e2e_project',
    })

    await workspace.expectProjectVisible('E2E Project')
    await workspace.selectProject('E2E Project')

    await workspace.uploadImageToSelectedProject('e2e-upload.png')
    await workspace.expectUploadSuccessMessage()
  })

})

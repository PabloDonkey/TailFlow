import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { WorkspacePageObject } from '../pages/WorkspacePageObject'

test.describe('Project and tagging workflows', () => {
  test('creates a project from project manager', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.showProjectsMode()

    await workspace.openCreateProjectDialog()
    await workspace.createProject({
      folderName: 'cross-device-e2e-project',
      classTag: 'character',
      displayName: 'Cross Device E2E Project',
      triggerTag: 'cross_device_e2e_project',
    })

    await workspace.expectProjectVisible('Cross Device E2E Project')
  })

  test('creates a project and uploads an image @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.showProjectsMode()

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

  test('adds and removes tag in inspector mode @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openActionsMenu()
    await workspace.showTagInspectorMode()

    await workspace.addTag('e2e_new_tag')
    await workspace.expectTagVisible('e2e_new_tag')

    await workspace.removeTag('e2e_new_tag')
    await workspace.expectTagNotVisible('e2e_new_tag')
  })
})

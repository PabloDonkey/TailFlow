import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { ProjectBrowserCardPageObject } from '../pages/cards/ProjectBrowserCardPageObject'

test.describe('Workspace Project Browser card', () => {
  test('selecting a project opens canvas with default panel state @desktop', async ({ page }) => {
    await installApiMocks(page)

    const projectBrowserCard = new ProjectBrowserCardPageObject(page)

    await projectBrowserCard.goto()
    await projectBrowserCard.openCard()
    await projectBrowserCard.selectProject('Sample Project')

    await projectBrowserCard.expectCanvasVisible()
    await projectBrowserCard.expectPanelVisible('Image Browser')
    await projectBrowserCard.expectPanelVisible('Current Tags')
    await projectBrowserCard.expectPanelVisible('AI Proposed Tags')
    await projectBrowserCard.expectPanelHidden('Project Details')
  })

  test('selecting a project restores persisted panel state @desktop', async ({ page }) => {
    await installApiMocks(page)

    const projectBrowserCard = new ProjectBrowserCardPageObject(page)
    await projectBrowserCard.seedPersistedWorkspaceState({
      openState: {
        imageBrowser: true,
        canvas: true,
        currentTags: false,
        aiProposedTags: false,
        tagsLibrary: false,
        projectDetails: true,
      },
    })

    await projectBrowserCard.goto()
    await projectBrowserCard.openCard()
    await projectBrowserCard.selectProject('Sample Project')

    await projectBrowserCard.expectCanvasVisible()
    await projectBrowserCard.expectPanelVisible('Image Browser')
    await projectBrowserCard.expectPanelVisible('Project Details')
    await projectBrowserCard.expectPanelHidden('Current Tags')
    await projectBrowserCard.expectPanelHidden('AI Proposed Tags')
  })

  test('creates a new project from project browser flow @desktop', async ({ page }) => {
    await installApiMocks(page)

    const projectBrowserCard = new ProjectBrowserCardPageObject(page)

    await projectBrowserCard.goto()
    await projectBrowserCard.openCard()
    await projectBrowserCard.openCreateProjectDialog()
    await projectBrowserCard.createProject({
      folderName: 'project-browser-create',
      classTag: 'character',
      displayName: 'Project Browser Create',
      triggerTag: 'project_browser_create',
    })

    await projectBrowserCard.expectProjectVisible('Project Browser Create')
  })
})

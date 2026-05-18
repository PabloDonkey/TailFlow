import { expect, type Page } from '@playwright/test'

export class ProjectBrowserCardPageObject {
  private static readonly WORKSPACE_STATE_KEY = 'tailflow.workspace-card-state.v1'

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
    await expect(this.page.getByText('Current project')).toBeVisible()
  }

  async seedPersistedWorkspaceState(payload: {
    openState: {
      imageBrowser: boolean
      canvas: boolean
      currentTags: boolean
      aiProposedTags: boolean
      tagsLibrary: boolean
      projectDetails: boolean
    }
  }): Promise<void> {
    await this.page.addInitScript(
      ({ storageKey, state }) => {
        globalThis.localStorage.setItem(storageKey, JSON.stringify(state))
      },
      {
        storageKey: ProjectBrowserCardPageObject.WORKSPACE_STATE_KEY,
        state: {
          openState: {
            'image-browser': payload.openState.imageBrowser,
            canvas: payload.openState.canvas,
            'current-tags': payload.openState.currentTags,
            'ai-proposed-tags': payload.openState.aiProposedTags,
            'tags-library': payload.openState.tagsLibrary,
            'project-details': payload.openState.projectDetails,
          },
        },
      },
    )
  }

  async openCard(): Promise<void> {
    const closeCanvasButton = this.page.getByRole('button', { name: 'Close Image Canvas panel' })
    await closeCanvasButton.click()
    await expect(this.page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
  }

  async expectCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
  }

  async selectProject(projectName: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(projectName, 'i') }).click()
  }

  async expectCanvasVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
  }

  async expectPanelVisible(panelName: 'Image Browser' | 'Current Tags' | 'AI Proposed Tags' | 'Project Details'): Promise<void> {
    await expect(this.page.getByRole('heading', { name: panelName }).first()).toBeVisible()
  }

  async expectPanelHidden(panelName: 'Image Browser' | 'Current Tags' | 'AI Proposed Tags' | 'Project Details'): Promise<void> {
    await expect(this.page.getByRole('heading', { name: panelName })).toHaveCount(0)
  }

  async expectProjectVisible(projectName: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: new RegExp(projectName, 'i') })).toBeVisible()
  }

  async openCreateProjectDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create Project' }).click()
    await expect(this.page.getByRole('dialog', { name: 'Create Project' })).toBeVisible()
  }

  async createProject(values: {
    folderName: string
    classTag: string
    displayName?: string
    triggerTag?: string
  }): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Create Project' })
    await dialog.getByRole('textbox', { name: 'Folder Name' }).fill(values.folderName)
    await dialog.getByRole('textbox', { name: 'Class Tag' }).fill(values.classTag)

    if (values.displayName) {
      await dialog.getByRole('textbox', { name: 'Display Name (optional)' }).fill(values.displayName)
    }

    if (values.triggerTag) {
      await dialog.getByRole('textbox', { name: 'Trigger Tag (optional)' }).fill(values.triggerTag)
    }

    await dialog.getByRole('button', { name: 'Create Project' }).click()
    await expect(dialog).toBeHidden()
  }
}

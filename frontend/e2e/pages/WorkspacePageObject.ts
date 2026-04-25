import { expect, type Locator, type Page } from '@playwright/test'

export class WorkspacePageObject {
  private readonly page: Page
  private readonly openActionsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.openActionsButton = page.getByRole('button', { name: 'Open workspace actions' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
    await expect(this.page.getByText('Current project')).toBeVisible()
  }

  async openActionsMenu(): Promise<void> {
    await this.openActionsButton.click()
    await expect(this.page.getByRole('button', { name: 'Close workspace actions' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Project manager' })).toBeVisible()
  }

  async expectActionsOptionSelected(option: 'projects' | 'tags' | 'inspector'): Promise<void> {
    const optionLabelByMode: Record<typeof option, string> = {
      projects: 'Project manager',
      tags: 'Tags library',
      inspector: 'Tag inspector',
    }

    await expect(this.page.getByRole('button', { name: optionLabelByMode[option] })).toHaveAttribute('aria-selected', 'true')
  }

  async showProjectsMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'Project manager' }).click()
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showTagsLibraryMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'Tags library' }).click()
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toBeVisible()
  }

  async showTagInspectorMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'Tag inspector' }).click()
  }

  async openMobilePanel(panelName: 'Browse' | 'Inspect' | 'Tags'): Promise<void> {
    await this.page.getByRole('button', { name: panelName }).click()
  }

  async expectMobilePanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Close mobile workspace panel' })).toBeVisible()
  }

  async closeMobilePanel(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close mobile workspace panel' }).click()
    await expect(this.page.getByRole('button', { name: 'Close mobile workspace panel' })).toHaveCount(0)
  }

  async expectDesktopQuickActionsHidden(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Open mobile browser panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile inspector panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile tags panel' })).toHaveCount(0)
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

  async expectProjectVisible(projectName: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: new RegExp(projectName, 'i') })).toBeVisible()
  }

  async selectProject(projectName: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(projectName, 'i') }).click()
  }

  async uploadImageToSelectedProject(fileName = 'upload.png'): Promise<void> {
    const fileInput = this.page.getByLabel('Upload images to project')
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQf6fYQAAAAASUVORK5CYII=',
        'base64',
      ),
    })

    await this.page.getByRole('button', { name: 'Upload to Dataset' }).click()
  }

  async expectUploadSuccessMessage(): Promise<void> {
    await expect(this.page.getByText(/Upload complete:/)).toBeVisible()
  }

  async addTag(tagName: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Add tag' }).fill(tagName)
    await this.page.getByRole('button', { name: 'Add' }).click()
  }

  async expectTagVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toBeVisible()
  }

  async removeTag(tagName: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove tag ${tagName}` }).click()
  }

  async expectTagNotVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toHaveCount(0)
  }
}

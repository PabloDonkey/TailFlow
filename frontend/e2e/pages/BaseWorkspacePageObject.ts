import { expect, type Locator, type Page } from '@playwright/test'

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQf6fYQAAAAASUVORK5CYII='

function getNodeBufferFromBase64(base64: string): unknown {
  const nodeBuffer = (globalThis as unknown as {
    Buffer: { from: (data: string, encoding: 'base64') => unknown }
  }).Buffer
  return nodeBuffer.from(base64, 'base64')
}

export abstract class BaseWorkspacePageObject {
  protected readonly page: Page
  protected readonly openActionsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.openActionsButton = page.getByRole('button', { name: 'Open workspace actions' })
  }

  protected mobileActionsPanel(): Locator {
    return this.page.getByTestId('workspace-actions-menu')
  }

  protected mobileActionsBackdrop(): Locator {
    return this.page.getByTestId('workspace-actions-backdrop')
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
    await expect(this.page.getByText('Current project')).toBeVisible()
  }

  async chooseTaggingFromProjectBrowser(projectName: string): Promise<void> {
    const projectCard = this.page.getByRole('button', { name: new RegExp(projectName, 'i') })
    await expect(projectCard).toBeVisible()
    await projectCard.click()
  }

  async expectCanvasVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
  }

  async expectProjectBrowserVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
  }

  async expectImageBrowserVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Browser' }).first()).toBeVisible()
  }

  async expectProjectBrowserHidden(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toHaveCount(0)
  }

  async closeCanvas(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
  }

  async expectNonProjectBrowserCardsHidden(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Image Browser' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Current Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'AI Proposed Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Project Details' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toHaveCount(0)
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
    await this.showProjectDetailsMode()

    const fileInput = this.page.getByLabel('Upload images to project')
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: getNodeBufferFromBase64(tinyPngBase64) as never,
    })

    await this.page.getByRole('button', { name: 'Upload to Dataset' }).click()
  }

  async expectUploadSuccessMessage(): Promise<void> {
    await expect(this.page.getByText(/Upload complete:/)).toBeVisible()
  }

  async addTag(tagName: string): Promise<void> {
    const input = this.page.getByPlaceholder('Search tags')
    await input.fill(tagName)
    await input.press('Enter')
  }

  async selectImage(imageFilename: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(imageFilename, 'i') }).click()
  }

  async expectImageVisibleInBrowser(imageFilename: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: new RegExp(imageFilename, 'i') })).toBeVisible()
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

  async expectCurrentTagsCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Current Tags' }).first()).toBeVisible()
  }

  async expectAiProposedTagsCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'AI Proposed Tags' }).first()).toBeVisible()
  }

  async expectProjectDetailsCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Details' }).first()).toBeVisible()
  }

  abstract openActionsMenu(): Promise<void>
  abstract closeImageCanvas(): Promise<void>
  abstract showProjectDetailsMode(): Promise<void>
}

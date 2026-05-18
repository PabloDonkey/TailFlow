import { expect, type Locator, type Page } from '@playwright/test'

export class ProjectDetailsCardPageObject {
  private readonly page: Page
  private readonly viewsMenuTrigger: Locator

  constructor(page: Page) {
    this.page = page
    this.viewsMenuTrigger = page.getByRole('menuitem', { name: 'Views' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
    await expect(this.page.getByText('Current project')).toBeVisible()
  }

  private desktopViewsOption(label: string): Locator {
    return this.page.getByRole('menuitem', { name: label })
  }

  private async ensureViewsMenuOpen(): Promise<void> {
    const tagsOption = this.desktopViewsOption('Tags library')
    if (await tagsOption.isVisible()) {
      return
    }
    await this.viewsMenuTrigger.click()
    await expect(tagsOption).toBeVisible()
  }

  async openCardWithProject(projectName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
    await this.page.getByRole('button', { name: new RegExp(projectName, 'i') }).click()

    const detailsHeading = this.page.getByRole('heading', { name: 'Project Details' }).first()
    if (await detailsHeading.isVisible()) {
      return
    }

    await this.ensureViewsMenuOpen()
    await this.desktopViewsOption('Project details').click()
    await expect(detailsHeading).toBeVisible()
  }

  async expectCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Details' }).first()).toBeVisible()
  }

  async saveProjectMetadata(values: {
    triggerTag: string
    classTag: string
    taggingMode: 'e621' | 'booru'
  }): Promise<void> {
    const editor = this.page.locator('.details-card')
    await editor.getByRole('textbox').nth(0).fill(values.triggerTag)
    await editor.getByRole('textbox').nth(1).fill(values.classTag)
    await this.page.getByTestId('edit-tagging-mode').selectOption(values.taggingMode)
    await this.page.getByRole('button', { name: 'Save Metadata' }).click()
  }

  async uploadImage(fileName: string): Promise<void> {
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

  async selectImage(imageName: string): Promise<void> {
    const imageBrowserHeading = this.page.getByRole('heading', { name: 'Image Browser' }).first()
    if (!(await imageBrowserHeading.isVisible())) {
      await this.ensureViewsMenuOpen()
      await this.desktopViewsOption('Image browser').click()
      await expect(imageBrowserHeading).toBeVisible()
    }

    await this.page.getByRole('button', { name: new RegExp(imageName, 'i') }).click()
  }

  async showCurrentTagsMode(): Promise<void> {
    const currentTagsHeading = this.page.getByRole('heading', { name: 'Current Tags' }).first()
    if (await currentTagsHeading.isVisible()) {
      return
    }

    await this.ensureViewsMenuOpen()
    await this.desktopViewsOption('Current tags').click()
    await expect(currentTagsHeading).toBeVisible()
  }

  async expectTagVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toBeVisible()
  }
}

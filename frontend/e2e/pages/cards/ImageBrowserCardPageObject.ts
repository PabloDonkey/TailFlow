import { expect, type Page } from '@playwright/test'

export class ImageBrowserCardPageObject {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async expectCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Browser' }).first()).toBeVisible()
  }

  async selectImage(imageFilename: string): Promise<void> {
    await this.expectCardVisible()
    const escapedFilename = imageFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await this.page
      .getByRole('button', { name: new RegExp(`^${escapedFilename}\\s`, 'i') })
      .first()
      .click()
  }
}

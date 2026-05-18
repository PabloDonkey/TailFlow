import { expect, type Locator, type Page } from '@playwright/test'

export class ImageCanvasCardPageObject {
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

  async openCardWithProject(projectName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
    const projectCard = this.page.getByRole('button', { name: new RegExp(projectName, 'i') })
    await expect(projectCard).toBeVisible()
    await projectCard.click()
    await this.expectCardVisible()
  }

  async expectCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
  }

  async goToNextImage(): Promise<void> {
    await this.page.getByTestId('next-image-button').click()
  }

  async goToPreviousImage(): Promise<void> {
    await this.page.getByTestId('previous-image-button').click()
  }

  async jumpToImageNumber(index: number): Promise<void> {
    const input = this.page.getByTestId('image-number-input')
    await input.fill(String(index))
    await input.press('Enter')
  }

  async openImageBrowserFromViews(): Promise<void> {
    await this.viewsMenuTrigger.click()
    await this.page.getByRole('menuitem', { name: 'Image browser' }).click()
    await expect(this.page.getByRole('heading', { name: 'Image Browser' }).first()).toBeVisible()
  }

  async expectCanvasImageWithFilename(imageFilename: string): Promise<void> {
    await expect(
      this.page.locator(`img[aria-description="Current canvas image: ${imageFilename}"]`).first(),
    ).toBeVisible()
  }

  async expectCurrentImageIndex(index: number): Promise<void> {
    await expect(this.page.getByTestId('image-number-input')).toHaveValue(String(index))
  }
}

import { expect, type Page } from '@playwright/test'

export class WorkspaceCanvasProjectBrowserPageObject {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
  }

  async ensureProjectBrowserMode(): Promise<void> {
    const closeCanvasButton = this.page.getByRole('button', { name: 'Close Image Canvas panel' })
    if (await closeCanvasButton.isVisible()) {
      await closeCanvasButton.click()
    }

    const projectBrowserTab = this.page.getByRole('button', { name: 'Project Browser' })
    if (await projectBrowserTab.isVisible()) {
      await projectBrowserTab.click()
    }

    await expect(this.page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
  }

  async selectProject(projectName: string): Promise<void> {
    const projectButton = this.page.getByRole('button', { name: new RegExp(projectName, 'i') })
    await expect(projectButton).toBeVisible()
    await projectButton.click()
  }

  async closeCanvas(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
  }

  async expectCanvasVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
  }

  async expectProjectBrowserVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
  }

  async expectProjectBrowserHidden(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toHaveCount(0)
  }

  async expectNonProjectBrowserCardsHidden(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Image Browser' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Current Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'AI Proposed Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Project Details' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toHaveCount(0)
  }
}

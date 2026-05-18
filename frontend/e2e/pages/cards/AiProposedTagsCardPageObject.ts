import { expect, type Locator, type Page } from '@playwright/test'

export class AiProposedTagsCardPageObject {
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

  async openCardWithImage(projectName: string, imageName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
    await this.page.getByRole('button', { name: new RegExp(projectName, 'i') }).click()

    const imageButton = this.page.getByRole('button', { name: new RegExp(imageName, 'i') }).first()
    if (await imageButton.isVisible()) {
      await imageButton.click()
    }

    const aiHeading = this.page.getByRole('heading', { name: 'AI Proposed Tags' }).first()
    if (await aiHeading.isVisible()) {
      return
    }

    await this.ensureViewsMenuOpen()
    await this.desktopViewsOption('AI proposed tags').click()
    await expect(aiHeading).toBeVisible()
  }

  async expectCardVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'AI Proposed Tags' }).first()).toBeVisible()
  }

  async runManualScan(): Promise<void> {
    await this.page.getByRole('button', { name: 'Scan now' }).click()
  }

  async toggleAutoScan(): Promise<void> {
    await this.page.getByRole('switch', { name: 'Toggle auto scan' }).click()
  }

  async expectAutoScanEnabled(enabled: boolean): Promise<void> {
    await expect(this.page.getByRole('switch', { name: 'Toggle auto scan' })).toHaveAttribute(
      'aria-checked',
      enabled ? 'true' : 'false',
    )
  }

  async expectProposedTagVisible(tagName: string): Promise<void> {
    const proposedTagsList = this.page.getByRole('group', { name: 'AI proposed tags list' })
    await expect(proposedTagsList.getByTestId('tag-chip').filter({ hasText: tagName })).toHaveCount(1)
  }

  async toggleProposedTag(tagName: string): Promise<void> {
    const proposedTagsList = this.page.getByRole('group', { name: 'AI proposed tags list' })
    await proposedTagsList.getByTestId('tag-chip').filter({ hasText: tagName }).first().click()
  }
}

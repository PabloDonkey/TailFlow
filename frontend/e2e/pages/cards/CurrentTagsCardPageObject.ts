import { expect, type Locator, type Page } from '@playwright/test'

export class CurrentTagsCardPageObject {
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

    const currentTagsHeading = this.page.getByRole('heading', { name: 'Current Tags' }).first()

    if (!(await currentTagsHeading.isVisible())) {
      await this.ensureViewsMenuOpen()
      await this.desktopViewsOption('Current tags').click()
    }

    await expect(currentTagsHeading).toBeVisible()
  }

  async addTag(tagName: string): Promise<void> {
    const input = this.page.getByPlaceholder('Search tags')
    await input.fill(tagName)
    await input.press('Enter')
  }

  async filterCurrentTags(query: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Filter current tags' }).fill(query)
  }

  async expectTagVisible(tagName: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: `Remove tag ${tagName}` })).toBeVisible()
  }

  async expectTagHidden(tagName: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: `Remove tag ${tagName}` })).toHaveCount(0)
  }

  async expectTagChipVisible(tagName: string): Promise<void> {
    await expect(this.page.getByTestId('tag-chip').filter({ hasText: tagName })).toHaveCount(1)
  }

  async removeTag(tagName: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove tag ${tagName}` }).click()
  }

  async expectTagNotVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toHaveCount(0)
  }

  async expectTagChipHidden(tagName: string): Promise<void> {
    await expect(this.page.getByTestId('tag-chip').filter({ hasText: tagName })).toHaveCount(0)
  }
}

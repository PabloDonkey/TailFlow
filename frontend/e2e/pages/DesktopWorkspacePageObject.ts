import { expect, type Locator, type Page } from '@playwright/test'
import { BaseWorkspacePageObject } from './BaseWorkspacePageObject'

export class DesktopWorkspacePageObject extends BaseWorkspacePageObject {
  private readonly viewsMenuTrigger: Locator

  constructor(page: Page) {
    super(page)
    this.viewsMenuTrigger = page.getByRole('menuitem', { name: 'Views' })
  }

  private async ensureDesktopViewsMenuOpen(): Promise<void> {
    const tagsOption = this.page.getByRole('menuitem', { name: 'Tags library' })
    if (await tagsOption.isVisible()) {
      return
    }
    await this.viewsMenuTrigger.click()
    await expect(tagsOption).toBeVisible()
  }

  private async desktopViewsOption(option: 'projects' | 'tags' | 'inspector') {
    const optionLabelByMode: Record<typeof option, string> = {
      projects: 'Image browser',
      tags: 'Tags library',
      inspector: 'Current tags',
    }

    await this.ensureDesktopViewsMenuOpen()
    return this.page.getByRole('menuitem', { name: optionLabelByMode[option] })
  }

  async openActionsMenu(): Promise<void> {
    await this.ensureDesktopViewsMenuOpen()
  }

  async expectActionsOptionSelected(option: 'projects' | 'tags' | 'inspector'): Promise<void> {
    const optionLocator = await this.desktopViewsOption(option)
    await expect(optionLocator.locator('xpath=.//span[normalize-space()="✓"]')).toHaveCount(1)
  }

  async closeImageCanvas(): Promise<void> {
    const closeCanvasButton = this.page.getByRole('button', { name: 'Close Image Canvas panel' })
    await closeCanvasButton.click()
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showProjectDetailsMode(): Promise<void> {
    await this.ensureDesktopViewsMenuOpen()
    const optionLocator = this.page.getByRole('menuitem', { name: 'Project details' })
    const selected = await optionLocator.getAttribute('aria-selected')
    if (selected !== 'true') {
      await optionLocator.click()
    }
  }

  async expectDesktopQuickActionsHidden(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Open mobile browser panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile inspector panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile tags panel' })).toHaveCount(0)
  }
}

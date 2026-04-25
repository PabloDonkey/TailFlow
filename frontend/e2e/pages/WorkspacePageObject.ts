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
    await expect(this.page.getByText('Workspace actions')).toBeVisible()
  }

  async showProjectsMode(): Promise<void> {
    await this.page.getByRole('button', { name: /Open project manager|Project manager visible/ }).click()
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showTagsLibraryMode(): Promise<void> {
    await this.page.getByRole('button', { name: /Open tags library|Tags library visible/ }).click()
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toBeVisible()
  }

  async showTagInspectorMode(): Promise<void> {
    await this.page.getByRole('button', { name: /Show tag inspector|Tag inspector visible/ }).click()
    await expect(this.page.getByRole('heading', { name: 'Tag Inspector' })).toBeVisible()
  }

  async openMobilePanel(panelName: 'Browse' | 'Inspect' | 'Tags'): Promise<void> {
    await this.page.getByRole('button', { name: panelName }).click()
  }

  async expectMobilePanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Close mobile workspace panel' })).toBeVisible()
  }

  async expectDesktopQuickActionsHidden(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Browse' })).toBeHidden()
    await expect(this.page.getByRole('button', { name: 'Inspect' })).toBeHidden()
    await expect(this.page.getByRole('button', { name: 'Tags' })).toBeHidden()
  }
}

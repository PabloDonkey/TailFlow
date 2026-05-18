import { expect, type Page } from '@playwright/test'
import { BaseWorkspacePageObject } from './BaseWorkspacePageObject'

export class MobileWorkspacePageObject extends BaseWorkspacePageObject {
  constructor(page: Page) {
    super(page)
  }

  async openActionsMenu(): Promise<void> {
    const existingBackdrop = this.mobileActionsBackdrop()
    if (await existingBackdrop.isVisible()) {
      return
    }

    await this.openActionsButton.click()
    await expect(this.mobileActionsBackdrop()).toBeVisible()
    await expect(this.mobileActionsPanel().getByRole('button', { name: 'Image canvas', exact: true })).toBeVisible()
  }

  async ClickOnMobileActionBackDrop(): Promise<void> {
    const backdrop = this.mobileActionsBackdrop()
    await expect(backdrop).toBeVisible()
    await backdrop.click()
    await expect(backdrop).toHaveCount(0)
  }

  async closeImageCanvas(): Promise<void> {
    const closeCanvasButton = this.page.getByRole('button', { name: 'Close Image Canvas panel' })
    if (await closeCanvasButton.isVisible()) {
      await closeCanvasButton.click()
    }

    const projectBrowserTab = this.page.getByRole('button', { name: 'Project Browser' })
    await expect(projectBrowserTab).toBeVisible()
    await projectBrowserTab.click()

    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showProjectDetailsMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'Project details' }).click()
  }

  async openMobilePanel(panelName: 'Browse' | 'Inspect' | 'Tags'): Promise<void> {
    const tabLabelByPanel: Record<typeof panelName, string> = {
      Browse: 'Image Browser',
      Inspect: 'Current Tags',
      Tags: 'Tags Library',
    }

    const targetTabLabel = tabLabelByPanel[panelName]
    const targetTab = this.page.getByRole('button', { name: targetTabLabel, exact: true })

    if (!(await targetTab.isVisible())) {
      await this.openActionsMenu()
      await this.mobileActionsPanel().getByRole('button', {
        name: panelName === 'Tags' ? 'Tags library' : panelName === 'Inspect' ? 'Current tags' : 'Image browser',
        exact: true,
      }).click()
    }

    await this.page.getByRole('button', { name: targetTabLabel, exact: true }).click()
  }

  async expectMobilePanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title }).first()).toBeVisible()
  }

  async closeMobilePanel(): Promise<void> {
    await this.page.getByRole('button', { name: 'Project Browser', exact: true }).click()
  }
}

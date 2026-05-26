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
    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showProjectDetailsMode(): Promise<void> {
    await this.selectBottomPanel('Project Details')
  }

  async openBottomPanelMenu(): Promise<void> {
    await this.page.getByTestId('mobile-panel-menu-button').click()
    await expect(this.page.getByTestId('mobile-panel-menu')).toBeVisible()
  }

  async selectBottomPanel(panelName: 'Current Tags' | 'AI Proposed Tags' | 'Project Details'): Promise<void> {
    const panelButton = this.page.getByTestId('mobile-panel-menu').getByRole('button', { name: panelName, exact: true })
    if (!(await panelButton.isVisible())) {
      await this.openBottomPanelMenu()
    }

    await this.page.getByTestId('mobile-panel-menu').getByRole('button', { name: panelName, exact: true }).click()
  }

  async enterMobileWorkspace(projectName: string, imageName: string): Promise<void> {
    await this.chooseTaggingFromProjectBrowser(projectName)
    await this.expectImageBrowserVisible()
    await this.selectImage(imageName)
    await this.expectCanvasVisible()
  }

  async expectBottomPanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title }).first()).toBeVisible()
  }
}

import { expect, type Locator, type Page } from '@playwright/test'

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQf6fYQAAAAASUVORK5CYII='

function getNodeBufferFromBase64(base64: string): unknown {
  const nodeBuffer = (globalThis as unknown as {
    Buffer: { from: (data: string, encoding: 'base64') => unknown }
  }).Buffer
  return nodeBuffer.from(base64, 'base64')
}

export class WorkspacePageObject {
  private readonly page: Page
  private readonly openActionsButton: Locator
  private readonly viewsMenuTrigger: Locator

  constructor(page: Page) {
    this.page = page
    this.openActionsButton = page.getByRole('button', { name: 'Open workspace actions' })
    this.viewsMenuTrigger = page.getByRole('menuitem', { name: 'Views' })
  }

  private async isDesktopViewport(): Promise<boolean> {
    return this.viewsMenuTrigger.isVisible()
  }

  private mobileActionsPanel(): Locator {
    const closeButton = this.page.getByRole('button', { name: 'Close workspace actions' })
    return closeButton.locator('xpath=following-sibling::section[1]')
  }

  private async ensureDesktopViewsMenuOpen(): Promise<void> {
    const tagsOption = this.page.getByRole('menuitem', { name: 'Tags library' })
    if (await tagsOption.isVisible()) {
      return
    }
    await this.viewsMenuTrigger.click()
    await expect(tagsOption).toBeVisible()
  }

  private async desktopViewsOption(option: 'projects' | 'tags' | 'inspector'): Promise<Locator> {
    const optionLabelByMode: Record<typeof option, string> = {
      projects: 'Image browser',
      tags: 'Tags library',
      inspector: 'Current tags',
    }

    await this.ensureDesktopViewsMenuOpen()
    return this.page.getByRole('menuitem', { name: optionLabelByMode[option] })
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
    await expect(this.page.getByText('Current project')).toBeVisible()
  }

  async openActionsMenu(): Promise<void> {
    if (await this.isDesktopViewport()) {
      await this.ensureDesktopViewsMenuOpen()
      return
    }

    const existingCloseButton = this.page.getByRole('button', { name: 'Close workspace actions' })
    if (await existingCloseButton.isVisible()) {
      return
    }

    await this.openActionsButton.click()
    const closeButton = this.page.getByRole('button', { name: 'Close workspace actions' })
    await expect(closeButton).toBeVisible()
    const actionsPanel = this.mobileActionsPanel()
    await expect(actionsPanel.getByRole('button', { name: 'Image canvas', exact: true })).toBeVisible()
  }

  async expectActionsOptionSelected(option: 'projects' | 'tags' | 'inspector'): Promise<void> {
    const optionLabelByMode: Record<typeof option, string> = {
      projects: 'Image browser',
      tags: 'Tags library',
      inspector: 'Current tags',
    }

    if (await this.isDesktopViewport()) {
      const optionLocator = await this.desktopViewsOption(option)
      await expect(optionLocator.locator('xpath=.//span[normalize-space()="✓"]')).toHaveCount(1)
      return
    }

    const actionsPanel = this.mobileActionsPanel()
    await expect(actionsPanel.getByRole('button', { name: optionLabelByMode[option], exact: true })).toHaveAttribute('aria-selected', 'true')
  }

  async showProjectsMode(): Promise<void> {
    const closeActionsButton = this.page.getByRole('button', { name: 'Close workspace actions' })
    if (await closeActionsButton.isVisible()) {
      await closeActionsButton.click()
    }

    const closeCanvasButton = this.page.getByRole('button', { name: 'Close Image Canvas panel' })
    if (await closeCanvasButton.isVisible()) {
      await closeCanvasButton.click()
    }

    if (!(await this.isDesktopViewport())) {
      const projectBrowserTab = this.page.getByRole('button', { name: 'Project Browser' })
      if (await projectBrowserTab.isVisible()) {
        await projectBrowserTab.click()
      }
    }

    await expect(this.page.getByRole('heading', { name: 'Project Browser' })).toBeVisible()
  }

  async showTagsLibraryMode(): Promise<void> {
    const tagsLibraryHeading = this.page.getByRole('heading', { name: 'Tags Library' }).first()
    if (await tagsLibraryHeading.isVisible()) {
      return
    }

    if (await this.isDesktopViewport()) {
      const optionLocator = await this.desktopViewsOption('tags')
      await optionLocator.click()
    } else {
      await this.openMobilePanel('Tags')
    }
    await expect(tagsLibraryHeading).toBeVisible()
  }

  async showTagInspectorMode(): Promise<void> {
    const currentTagsHeading = this.page.getByRole('heading', { name: 'Current Tags' }).first()
    if (await currentTagsHeading.isVisible()) {
      return
    }

    if (await this.isDesktopViewport()) {
      const optionLocator = await this.desktopViewsOption('inspector')
      await optionLocator.click()
      return
    }

    const closeActionsButton = this.page.getByRole('button', { name: 'Close workspace actions' })
    if (await closeActionsButton.isVisible()) {
      await this.mobileActionsPanel().getByRole('button', { name: 'Current tags', exact: true }).click()
      await expect(currentTagsHeading).toBeVisible()
      return
    }

    await this.openMobilePanel('Inspect')
    await expect(currentTagsHeading).toBeVisible()
  }

  async chooseTaggingFromProjectBrowser(projectName: string): Promise<void> {
    const projectCard = this.page.getByRole('button', { name: new RegExp(projectName, 'i') })
    await expect(projectCard).toBeVisible()
    await projectCard.click()
  }

  async showProjectDetailsMode(): Promise<void> {
    if (await this.isDesktopViewport()) {
      await this.ensureDesktopViewsMenuOpen()
      const optionLocator = this.page.getByRole('menuitem', { name: 'Project details' })
      const selected = await optionLocator.getAttribute('aria-selected')
      if (selected !== 'true') {
        await optionLocator.click()
      }
      return
    }

    await this.page.getByRole('button', { name: 'Project details' }).click()
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

  async closeCanvas(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close Image Canvas panel' }).click()
  }

  async expectNonProjectBrowserCardsHidden(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Image Canvas' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Image Browser' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Current Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'AI Proposed Tags' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Project Details' })).toHaveCount(0)
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toHaveCount(0)
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
      const closeActionsButton = this.page.getByRole('button', { name: 'Close workspace actions' })
      if (await closeActionsButton.isVisible()) {
        await closeActionsButton.click()
      }
    }

    await this.page.getByRole('button', { name: targetTabLabel, exact: true }).click()
  }

  async expectMobilePanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title }).first()).toBeVisible()
  }

  async closeMobilePanel(): Promise<void> {
    await this.page.getByRole('button', { name: 'Project Browser', exact: true }).click()
  }

  async expectDesktopQuickActionsHidden(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Open mobile browser panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile inspector panel' })).toHaveCount(0)
    await expect(this.page.getByRole('button', { name: 'Open mobile tags panel' })).toHaveCount(0)
  }

  async openCreateProjectDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create Project' }).click()
    await expect(this.page.getByRole('dialog', { name: 'Create Project' })).toBeVisible()
  }

  async createProject(values: {
    folderName: string
    classTag: string
    displayName?: string
    triggerTag?: string
  }): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Create Project' })

    await dialog.getByRole('textbox', { name: 'Folder Name' }).fill(values.folderName)
    await dialog.getByRole('textbox', { name: 'Class Tag' }).fill(values.classTag)
    if (values.displayName) {
      await dialog.getByRole('textbox', { name: 'Display Name (optional)' }).fill(values.displayName)
    }
    if (values.triggerTag) {
      await dialog.getByRole('textbox', { name: 'Trigger Tag (optional)' }).fill(values.triggerTag)
    }

    await dialog.getByRole('button', { name: 'Create Project' }).click()
    await expect(dialog).toBeHidden()
  }

  async expectProjectVisible(projectName: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: new RegExp(projectName, 'i') })).toBeVisible()
  }

  async selectProject(projectName: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(projectName, 'i') }).click()
  }

  async uploadImageToSelectedProject(fileName = 'upload.png'): Promise<void> {
    await this.showProjectDetailsMode()

    const fileInput = this.page.getByLabel('Upload images to project')
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: getNodeBufferFromBase64(tinyPngBase64) as never,
    })

    await this.page.getByRole('button', { name: 'Upload to Dataset' }).click()
  }

  async expectUploadSuccessMessage(): Promise<void> {
    await expect(this.page.getByText(/Upload complete:/)).toBeVisible()
  }

  async addTag(tagName: string): Promise<void> {
    const input = this.page.getByPlaceholder('Search tags')
    await input.fill(tagName)
    await input.press('Enter')
  }

  async selectImage(imageFilename: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(imageFilename, 'i') }).click()
  }

  async expectTagVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toBeVisible()
  }

  async removeTag(tagName: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove tag ${tagName}` }).click()
  }

  async expectTagNotVisible(tagName: string): Promise<void> {
    await expect(this.page.getByText(tagName, { exact: true })).toHaveCount(0)
  }
}

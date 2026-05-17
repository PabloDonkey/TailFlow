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
      projects: 'Project manager',
      tags: 'Tags library',
      inspector: 'Tag inspector',
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

    await this.openActionsButton.click()
    await expect(this.page.getByRole('button', { name: 'Close workspace actions' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Image canvas' })).toBeVisible()
  }

  async expectActionsOptionSelected(option: 'projects' | 'tags' | 'inspector'): Promise<void> {
    const optionLabelByMode: Record<typeof option, string> = {
      projects: 'Project manager',
      tags: 'Tags library',
      inspector: 'Tag inspector',
    }

    if (await this.isDesktopViewport()) {
      const optionLocator = await this.desktopViewsOption(option)
      await expect(optionLocator).toHaveClass(/font-semibold/)
      return
    }

    await expect(this.page.getByRole('button', { name: optionLabelByMode[option] })).toHaveAttribute('aria-selected', 'true')
  }

  async showProjectsMode(): Promise<void> {
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
    if (await this.isDesktopViewport()) {
      const optionLocator = await this.desktopViewsOption('tags')
      await optionLocator.click()
    } else {
      await this.page.getByRole('button', { name: 'Tags library' }).click()
    }
    await expect(this.page.getByRole('heading', { name: 'Tags Library' })).toBeVisible()
  }

  async showTagInspectorMode(): Promise<void> {
    if (await this.isDesktopViewport()) {
      const optionLocator = this.page.getByRole('menuitem', { name: 'Current tags' })
      await this.ensureDesktopViewsMenuOpen()
      await optionLocator.click()
      return
    }

    await this.page.getByRole('button', { name: 'Current tags' }).click()
  }

  async chooseTaggingFromProjectBrowser(projectName: string): Promise<void> {
    const projectCard = this.page.getByRole('button', { name: new RegExp(projectName, 'i') })
    await expect(projectCard).toBeVisible()
    await projectCard.getByRole('button', { name: 'Tagging' }).click()
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
    const ariaLabelByPanel: Record<typeof panelName, string> = {
      Browse: 'Open mobile browser panel',
      Inspect: 'Open mobile inspector panel',
      Tags: 'Open mobile tags panel',
    }

    await this.page.getByRole('button', { name: ariaLabelByPanel[panelName] }).click()
  }

  async expectMobilePanelTitle(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title }).first()).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Close mobile workspace panel' })).toBeVisible()
  }

  async closeMobilePanel(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close mobile workspace panel' }).click()
    await expect(this.page.getByRole('button', { name: 'Close mobile workspace panel' })).toHaveCount(0)
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
    await this.page.getByLabel('Add tag').fill(tagName)
    await this.page.getByRole('button', { name: 'Add' }).click()
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

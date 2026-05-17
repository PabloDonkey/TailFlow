import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { WorkspacePageObject } from '../pages/WorkspacePageObject'

test.describe('Workspace mode switching', () => {
  test('switches between projects, tags library, and inspector', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.showProjectsMode()
    await workspace.showTagsLibraryMode()
    await workspace.showTagInspectorMode()
  })

  test('opens mobile tags panel from quick actions @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })

  test('in mobile inspector view, quick actions open drawer for browse inspect and tags @mobile', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.showProjectsMode()
    await workspace.chooseTaggingFromProjectBrowser('Sample Project')

    await workspace.openMobilePanel('Browse')
    await workspace.expectMobilePanelTitle('Image Browser')
    await workspace.closeMobilePanel()

    await workspace.openMobilePanel('Inspect')
    await workspace.expectMobilePanelTitle('Current Tags')
    await workspace.closeMobilePanel()

    await workspace.openMobilePanel('Tags')
    await workspace.expectMobilePanelTitle('Tags Library')
  })

  test('keeps quick actions hidden in desktop layout @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.expectDesktopQuickActionsHidden()
  })

  test('persists project details panel placement after moving from right to left @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.showProjectsMode()
    await workspace.chooseTaggingFromProjectBrowser('Sample Project')
    await workspace.showProjectDetailsMode()

    const dragProjectDetails = page.getByRole('button', { name: 'Drag Project Details panel' })
    const leftDropTarget = page.getByRole('heading', { name: 'Image Browser' }).first()
    await expect(dragProjectDetails).toBeVisible()
    await expect(leftDropTarget).toBeVisible()
    await dragProjectDetails.dragTo(leftDropTarget)

    const projectDetailsHeading = page.getByRole('heading', { name: 'Project Details' }).first()
    const canvasHeading = page.getByRole('heading', { name: 'Image Canvas' }).first()
    await expect(projectDetailsHeading).toBeVisible()
    await expect(canvasHeading).toBeVisible()

    const detailsBeforeReload = await projectDetailsHeading.boundingBox()
    const canvasBeforeReload = await canvasHeading.boundingBox()
    expect(detailsBeforeReload).not.toBeNull()
    expect(canvasBeforeReload).not.toBeNull()
    if (!detailsBeforeReload || !canvasBeforeReload) {
      return
    }
    expect(detailsBeforeReload.x).toBeLessThan(canvasBeforeReload.x)

    await page.reload()

    const projectDetailsAfterReload = page.getByRole('heading', { name: 'Project Details' }).first()
    const canvasAfterReload = page.getByRole('heading', { name: 'Image Canvas' }).first()
    await expect(projectDetailsAfterReload).toBeVisible()
    await expect(canvasAfterReload).toBeVisible()

    const detailsAfterReload = await projectDetailsAfterReload.boundingBox()
    const canvasAfterReloadBox = await canvasAfterReload.boundingBox()
    expect(detailsAfterReload).not.toBeNull()
    expect(canvasAfterReloadBox).not.toBeNull()
    if (!detailsAfterReload || !canvasAfterReloadBox) {
      return
    }
    expect(detailsAfterReload.x).toBeLessThan(canvasAfterReloadBox.x)
  })

  test('shows drop zone only while dragging and hides after finish @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new WorkspacePageObject(page)

    await workspace.goto()
    await workspace.showProjectsMode()
    await workspace.chooseTaggingFromProjectBrowser('Sample Project')
    await workspace.showProjectDetailsMode()

    const dropIndicators = page.getByTestId('side-drop-indicator')
    await expect(dropIndicators).toHaveCount(0)

    const imageBrowserHeading = page.getByRole('heading', { name: 'Image Browser' }).first()
    const imageBrowserBeforeDrag = await imageBrowserHeading.boundingBox()
    expect(imageBrowserBeforeDrag).not.toBeNull()
    await imageBrowserHeading.dispatchEvent('dragover', { clientY: 0 })
    await expect(dropIndicators).toHaveCount(0)

    const dragHandle = page.getByRole('button', { name: 'Drag Project Details panel' })
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer())

    await dragHandle.dispatchEvent('dragstart', { dataTransfer })
    await imageBrowserHeading.dispatchEvent('dragover', { dataTransfer, clientY: 0 })
    await expect(dropIndicators).toHaveCount(1)

    const activeIndicator = dropIndicators.first()
    await expect(activeIndicator).not.toHaveClass(/absolute/)

    const imageBrowserDuringDrag = await imageBrowserHeading.boundingBox()
    expect(imageBrowserDuringDrag).not.toBeNull()
    if (imageBrowserBeforeDrag && imageBrowserDuringDrag) {
      expect(imageBrowserDuringDrag.y).toBeGreaterThan(imageBrowserBeforeDrag.y)
    }

    await imageBrowserHeading.dispatchEvent('drop', { dataTransfer, clientY: 0 })
    await expect(dropIndicators).toHaveCount(0)

    await dragHandle.dispatchEvent('dragend', { dataTransfer })
    await expect(dropIndicators).toHaveCount(0)
  })

})

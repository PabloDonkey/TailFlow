import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { DesktopWorkspacePageObject } from '../pages/DesktopWorkspacePageObject'

test.describe('Workspace desktop mode switching', () => {
  test('keeps quick actions hidden in desktop layout @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new DesktopWorkspacePageObject(page)

    await workspace.goto()
    await workspace.expectDesktopQuickActionsHidden()
  })

  test('persists project details panel placement after moving from right to left @desktop', async ({ page }) => {
    await installApiMocks(page)

    const workspace = new DesktopWorkspacePageObject(page)

    await workspace.goto()
    await workspace.closeImageCanvas()
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

    const workspace = new DesktopWorkspacePageObject(page)

    await workspace.goto()
    await workspace.closeImageCanvas()
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
    const dataTransfer = await page.evaluateHandle(() => {
      const browserGlobal = globalThis as unknown as { DataTransfer: new () => unknown }
      return new browserGlobal.DataTransfer()
    })

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

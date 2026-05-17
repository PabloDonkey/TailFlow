import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'

async function ensureProjectBrowserMode(page: import('@playwright/test').Page): Promise<void> {
  const closeCanvasButton = page.getByRole('button', { name: 'Close Image Canvas panel' })
  if (await closeCanvasButton.isVisible()) {
    await closeCanvasButton.click()
  }

  const projectBrowserTab = page.getByRole('button', { name: 'Project Browser' })
  if (await projectBrowserTab.isVisible()) {
    await projectBrowserTab.click()
  }

  await expect(page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
}

test.describe('Workspace canvas and project browser transitions', () => {
  test('selecting a project in Project Browser hides Project Browser and shows Canvas', async ({ page }) => {
    await installApiMocks(page)

    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/workspace/)

    await ensureProjectBrowserMode(page)

    const sampleProjectCard = page.getByRole('button', { name: /Sample Project/i })
    await expect(sampleProjectCard).toBeVisible()
    await sampleProjectCard.click()

    await expect(page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Project Browser' })).toHaveCount(0)
  })

  test('closing Canvas shows Project Browser and hides all other cards', async ({ page }) => {
    await installApiMocks(page)

    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/workspace/)

    await ensureProjectBrowserMode(page)

    const sampleProjectCard = page.getByRole('button', { name: /Sample Project/i })
    await expect(sampleProjectCard).toBeVisible()
    await sampleProjectCard.click()

    await expect(page.getByRole('heading', { name: 'Image Canvas' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Close Image Canvas panel' }).click()

    await expect(page.getByRole('heading', { name: 'Project Browser' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Image Canvas' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Image Browser' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Current Tags' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AI Proposed Tags' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Project Details' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Tags Library' })).toHaveCount(0)
  })
})

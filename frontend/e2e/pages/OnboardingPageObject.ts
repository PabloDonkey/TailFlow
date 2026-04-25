import { expect, type Locator, type Page } from '@playwright/test'

export class OnboardingPageObject {
  private readonly page: Page
  private readonly heading: Locator
  private readonly rootPathInput: Locator
  private readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'TailFlow Onboarding' })
    this.rootPathInput = page.getByRole('textbox', { name: 'Project Root Path' })
    this.saveButton = page.getByRole('button', { name: 'Save and Continue' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding')
    await expect(this.heading).toBeVisible()
  }

  async saveProjectsRootPath(path: string): Promise<void> {
    await this.rootPathInput.fill(path)
    await this.saveButton.click()
  }
}

import { type Page } from '@playwright/test'

type OnboardingStatus = {
  configured: boolean
  projects_root_path: string | null
  default_projects_root_path: string
}

type MockOptions = {
  onboardingStatus?: OnboardingStatus
}

const defaultProjectId = '11111111-1111-4111-8111-111111111111'
const defaultImageId = '22222222-2222-4222-8222-222222222222'
const isoNow = '2026-04-25T00:00:00+00:00'
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQf6fYQAAAAASUVORK5CYII=',
  'base64',
)

function jsonHeaders() {
  return { 'content-type': 'application/json' }
}

export async function installApiMocks(page: Page, options: MockOptions = {}): Promise<void> {
  const onboardingStatus: OnboardingStatus = options.onboardingStatus ?? {
    configured: true,
    projects_root_path: '/tmp/tailflow-projects',
    default_projects_root_path: '/tmp/tailflow-projects',
  }
  let isOnboardingConfigured = onboardingStatus.configured

  await page.route('**/api/projects/onboarding/status', async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        configured: isOnboardingConfigured,
        projects_root_path: onboardingStatus.projects_root_path,
        default_projects_root_path: onboardingStatus.default_projects_root_path,
      }),
    })
  })

  await page.route('**/api/projects/onboarding/configure', async (route) => {
    isOnboardingConfigured = true
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        projects_root_path: onboardingStatus.default_projects_root_path,
      }),
    })
  })

  await page.route('**/api/projects/discover', async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        discovered_projects: 1,
        imported_projects: 1,
        marked_missing_projects: 0,
      }),
    })
  })

  await page.route('**/api/projects', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify([
        {
          id: defaultProjectId,
          name: 'Sample Project',
          folder_name: 'sample-project',
          root_path: '/tmp/tailflow-projects',
          dataset_path: '/tmp/tailflow-projects/sample-project/dataset',
          trigger_tag: 'sample_project',
          class_tag: 'character',
          tagging_mode: 'e621',
          last_synced_at: isoNow,
          missing_at: null,
        },
      ]),
    })
  })

  await page.route(`**/api/projects/${defaultProjectId}/images`, async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify([
        {
          id: defaultImageId,
          project_id: defaultProjectId,
          relative_path: 'images/sample.png',
          filename: 'sample.png',
          discovered_at: isoNow,
          tag_count: 1,
        },
      ]),
    })
  })

  await page.route(`**/api/projects/${defaultProjectId}/images/${defaultImageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        id: defaultImageId,
        project_id: defaultProjectId,
        relative_path: 'images/sample.png',
        filename: 'sample.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 1,
        tags: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'sample_project',
            catalog_ids: { e621: '12345' },
            category: 'meta',
            position: 0,
            is_protected: true,
          },
        ],
      }),
    })
  })

  await page.route('**/api/projects/*/images/*/tags', async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        id: defaultImageId,
        project_id: defaultProjectId,
        relative_path: 'images/sample.png',
        filename: 'sample.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 1,
        tags: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'sample_project',
            catalog_ids: { e621: '12345' },
            category: 'meta',
            position: 0,
            is_protected: true,
          },
        ],
      }),
    })
  })

  await page.route('**/api/tags', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify([
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'safe',
          catalog_ids: { e621: '1' },
          category: 'rating',
          created_at: isoNow,
        },
      ]),
    })
  })

  await page.route('**/api/projects/*/images/*/file', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'image/png' },
      body: tinyPng,
    })
  })
}

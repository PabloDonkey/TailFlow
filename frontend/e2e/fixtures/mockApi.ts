import { type Page } from '@playwright/test'

type OnboardingStatus = {
  configured: boolean
  projects_root_path: string | null
  default_projects_root_path: string
}

type MockOptions = {
  onboardingStatus?: OnboardingStatus
}

type ProjectRecord = {
  id: string
  name: string
  folder_name: string
  root_path: string
  dataset_path: string
  trigger_tag: string
  class_tag: string
  tagging_mode: 'e621' | 'booru'
  last_synced_at: string | null
  missing_at: string | null
}

type ImageSummaryRecord = {
  id: string
  project_id: string
  relative_path: string
  filename: string
  discovered_at: string
  tag_count: number
}

type ImageReadRecord = ImageSummaryRecord & {
  removed_at: string | null
  tags: Array<{
    id: string
    name: string
    catalog_ids: Record<string, string>
    category: string | null
    position: number
    is_protected: boolean
  }>
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
  let nextProjectCounter = 1
  let nextImageCounter = 1
  let nextTagCounter = 1

  const projects: ProjectRecord[] = [
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
  ]

  const imagesByProject = new Map<string, ImageSummaryRecord[]>([
    [
      defaultProjectId,
      [
        {
          id: defaultImageId,
          project_id: defaultProjectId,
          relative_path: 'images/sample.png',
          filename: 'sample.png',
          discovered_at: isoNow,
          tag_count: 2,
        },
      ],
    ],
  ])

  const imageDetails = new Map<string, ImageReadRecord>([
    [
      `${defaultProjectId}:${defaultImageId}`,
      {
        id: defaultImageId,
        project_id: defaultProjectId,
        relative_path: 'images/sample.png',
        filename: 'sample.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 2,
        tags: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'sample_project',
            catalog_ids: { e621: '12345' },
            category: 'meta',
            position: 0,
            is_protected: true,
          },
          {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'safe',
            catalog_ids: { e621: '1' },
            category: 'rating',
            position: 2,
            is_protected: false,
          },
        ],
      },
    ],
  ])

  function buildProjectId(counter: number): string {
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(counter).padStart(12, '0')}`
  }

  function buildImageId(counter: number): string {
    return `bbbbbbbb-bbbb-4bbb-8bbb-${String(counter).padStart(12, '0')}`
  }

  function buildTagId(counter: number): string {
    return `cccccccc-cccc-4ccc-8ccc-${String(counter).padStart(12, '0')}`
  }

  function getProjectAndImageFromUrl(url: string): { projectId: string; imageId: string } | null {
    const match = /\/api\/projects\/([^/]+)\/images\/([^/]+)/.exec(url)
    if (!match) {
      return null
    }

    const projectId = match[1]
    const imageId = match[2]
    if (!projectId || !imageId) {
      return null
    }

    return { projectId, imageId }
  }

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
    const method = route.request().method()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(projects),
      })
      return
    }

    if (method === 'POST') {
      const payload = JSON.parse(route.request().postData() ?? '{}') as {
        folder_name?: string
        class_tag?: string
        name?: string
        trigger_tag?: string
        tagging_mode?: 'e621' | 'booru'
      }

      const projectId = buildProjectId(nextProjectCounter)
      nextProjectCounter += 1

      const folderName = payload.folder_name ?? `project-${nextProjectCounter}`
      const triggerTag = payload.trigger_tag ?? folderName.replace(/[^a-zA-Z0-9_]/g, '_')
      const project: ProjectRecord = {
        id: projectId,
        name: payload.name ?? folderName,
        folder_name: folderName,
        root_path: onboardingStatus.default_projects_root_path,
        dataset_path: `${onboardingStatus.default_projects_root_path}/${folderName}/dataset`,
        trigger_tag: triggerTag,
        class_tag: payload.class_tag ?? 'character',
        tagging_mode: payload.tagging_mode ?? 'e621',
        last_synced_at: isoNow,
        missing_at: null,
      }

      projects.push(project)
      imagesByProject.set(projectId, [])

      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ project }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/projects/*/images', async (route) => {
    const method = route.request().method()
    const url = route.request().url()
    const match = /\/api\/projects\/([^/]+)\/images$/.exec(url)
    const projectId = match?.[1]

    if (!projectId) {
      await route.fallback()
      return
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(imagesByProject.get(projectId) ?? []),
      })
      return
    }

    if (method === 'POST') {
      const uploadedFilename = 'uploaded-image.png'
      const imageId = buildImageId(nextImageCounter)
      nextImageCounter += 1

      const imageSummary: ImageSummaryRecord = {
        id: imageId,
        project_id: projectId,
        relative_path: `images/${uploadedFilename}`,
        filename: uploadedFilename,
        discovered_at: isoNow,
        tag_count: 0,
      }

      const current = imagesByProject.get(projectId) ?? []
      imagesByProject.set(projectId, [...current, imageSummary])
      imageDetails.set(`${projectId}:${imageId}`, {
        ...imageSummary,
        removed_at: null,
        tags: [],
      })

      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          project_id: projectId,
          uploaded_files: [uploadedFilename],
          created_records: 1,
          restored_records: 0,
        }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/projects/*/images/*', async (route) => {
    const routeInfo = getProjectAndImageFromUrl(route.request().url())
    if (!routeInfo) {
      await route.fallback()
      return
    }

    const detail = imageDetails.get(`${routeInfo.projectId}:${routeInfo.imageId}`)
    if (!detail) {
      await route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({ detail: 'Image not found' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(detail),
    })
  })

  await page.route('**/api/projects/*/images/*/tags', async (route) => {
    const routeInfo = getProjectAndImageFromUrl(route.request().url())
    if (!routeInfo) {
      await route.fallback()
      return
    }

    const detailKey = `${routeInfo.projectId}:${routeInfo.imageId}`
    const detail = imageDetails.get(detailKey)
    if (!detail) {
      await route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({ detail: 'Image not found' }),
      })
      return
    }

    const payload = JSON.parse(route.request().postData() ?? '{}') as {
      add?: string[]
      remove?: string[]
    }

    const removeSet = new Set((payload.remove ?? []).map((value) => value.trim()).filter(Boolean))
    const nextTags = detail.tags.filter((tag) => !removeSet.has(tag.name))

    for (const name of payload.add ?? []) {
      const trimmed = name.trim()
      if (!trimmed || nextTags.some((tag) => tag.name === trimmed)) {
        continue
      }

      const newTagId = buildTagId(nextTagCounter)
      nextTagCounter += 1

      nextTags.push({
        id: newTagId,
        name: trimmed,
        catalog_ids: {},
        category: null,
        position: nextTags.length + 2,
        is_protected: false,
      })
    }

    const updatedDetail: ImageReadRecord = {
      ...detail,
      tags: nextTags,
      tag_count: nextTags.length,
    }

    imageDetails.set(detailKey, updatedDetail)
    const summaries = imagesByProject.get(routeInfo.projectId) ?? []
    imagesByProject.set(
      routeInfo.projectId,
      summaries.map((summary) =>
        summary.id === routeInfo.imageId
          ? {
              ...summary,
              tag_count: updatedDetail.tag_count,
            }
          : summary,
      ),
    )

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(updatedDetail),
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

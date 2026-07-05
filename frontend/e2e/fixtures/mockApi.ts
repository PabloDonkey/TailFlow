import { type Page } from '@playwright/test'

type OnboardingStatus = {
  configured: boolean
  projects_root_path: string | null
  model_storage_path: string | null
  default_projects_root_path: string
  default_model_storage_path: string
}

type MockOptions = {
  onboardingStatus?: OnboardingStatus
  /** Number of default images to seed for Sample Project (1–3, default 3). */
  imageCount?: number
}

type ProjectPreviewImageRecord = {
  id: string
  relative_path: string
  filename: string
  content_hash: string | null
  discovered_at: string
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
  featured_image_id: string | null
  preview_image: ProjectPreviewImageRecord | null
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
const secondImageId = '22222222-2222-4222-8222-222222222223'
const thirdImageId = '22222222-2222-4222-8222-222222222224'
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
    model_storage_path: '/tmp/models',
    default_projects_root_path: '/tmp/tailflow-projects',
    default_model_storage_path: '/tmp/models',
  }
  let isOnboardingConfigured = onboardingStatus.configured
  let nextProjectCounter = 1
  let nextImageCounter = 1
  let nextTagCounter = 1
  const imageCount = options.imageCount ?? 3

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
      featured_image_id: defaultImageId,
      preview_image: {
        id: defaultImageId,
        relative_path: 'images/sample-1.png',
        filename: 'sample-1.png',
        content_hash: null,
        discovered_at: isoNow,
      },
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
          relative_path: 'images/sample-1.png',
          filename: 'sample-1.png',
          discovered_at: isoNow,
          tag_count: 3,
        },
        {
          id: secondImageId,
          project_id: defaultProjectId,
          relative_path: 'images/sample-2.png',
          filename: 'sample-2.png',
          discovered_at: isoNow,
          tag_count: 3,
        },
        {
          id: thirdImageId,
          project_id: defaultProjectId,
          relative_path: 'images/sample-3.png',
          filename: 'sample-3.png',
          discovered_at: isoNow,
          tag_count: 3,
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
        relative_path: 'images/sample-1.png',
        filename: 'sample-1.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 3,
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
            id: '33333333-3333-4333-8333-333333333334',
            name: 'character',
            catalog_ids: { e621: '5' },
            category: 'meta',
            position: 1,
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
    [
      `${defaultProjectId}:${secondImageId}`,
      {
        id: secondImageId,
        project_id: defaultProjectId,
        relative_path: 'images/sample-2.png',
        filename: 'sample-2.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 3,
        tags: [
          {
            id: '53333333-3333-4333-8333-333333333333',
            name: 'sample_project',
            catalog_ids: { e621: '12345' },
            category: 'meta',
            position: 0,
            is_protected: true,
          },
          {
            id: '53333333-3333-4333-8333-333333333334',
            name: 'character',
            catalog_ids: { e621: '5' },
            category: 'meta',
            position: 1,
            is_protected: true,
          },
          {
            id: '54444444-4444-4444-8444-444444444444',
            name: 'safe',
            catalog_ids: { e621: '1' },
            category: 'rating',
            position: 2,
            is_protected: false,
          },
        ],
      },
    ],
    [
      `${defaultProjectId}:${thirdImageId}`,
      {
        id: thirdImageId,
        project_id: defaultProjectId,
        relative_path: 'images/sample-3.png',
        filename: 'sample-3.png',
        discovered_at: isoNow,
        removed_at: null,
        tag_count: 3,
        tags: [
          {
            id: '63333333-3333-4333-8333-333333333333',
            name: 'sample_project',
            catalog_ids: { e621: '12345' },
            category: 'meta',
            position: 0,
            is_protected: true,
          },
          {
            id: '63333333-3333-4333-8333-333333333334',
            name: 'character',
            catalog_ids: { e621: '5' },
            category: 'meta',
            position: 1,
            is_protected: true,
          },
          {
            id: '64444444-4444-4444-8444-444444444444',
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

  if (imageCount < 3) {
    const allImages = imagesByProject.get(defaultProjectId) ?? []
    imagesByProject.set(defaultProjectId, allImages.slice(0, imageCount))
    for (const img of allImages.slice(imageCount)) {
      imageDetails.delete(`${defaultProjectId}:${img.id}`)
    }
  }

  function toProjectPreview(image: ImageSummaryRecord): ProjectPreviewImageRecord {
    return {
      id: image.id,
      relative_path: image.relative_path,
      filename: image.filename,
      content_hash: null,
      discovered_at: image.discovered_at,
    }
  }

  function refreshProjectPreview(projectId: string): void {
    const projectIndex = projects.findIndex((project) => project.id === projectId)
    if (projectIndex < 0) {
      return
    }

    const currentProject = projects[projectIndex]
    if (!currentProject) {
      return
    }

    const images = imagesByProject.get(projectId) ?? []
    if (images.length === 0) {
      projects[projectIndex] = {
        ...currentProject,
        featured_image_id: null,
        preview_image: null,
      }
      return
    }

    const featured = currentProject.featured_image_id
      ? images.find((image) => image.id === currentProject.featured_image_id)
      : undefined
    const resolvedFeatured = featured ?? images[0]

    projects[projectIndex] = {
      ...currentProject,
      featured_image_id: resolvedFeatured ? resolvedFeatured.id : null,
      preview_image: resolvedFeatured ? toProjectPreview(resolvedFeatured) : null,
    }
  }

  for (const project of projects) {
    refreshProjectPreview(project.id)
  }

  function upsertProtectedTag(detail: ImageReadRecord, position: number, name: string): void {
    const existing = detail.tags.find((tag) => tag.position === position && tag.is_protected)
    if (existing) {
      existing.name = name
      return
    }

    detail.tags.push({
      id: buildTagId(nextTagCounter),
      name,
      catalog_ids: {},
      category: 'meta',
      position,
      is_protected: true,
    })
    nextTagCounter += 1
  }

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
        model_storage_path: onboardingStatus.model_storage_path,
        default_projects_root_path: onboardingStatus.default_projects_root_path,
        default_model_storage_path: onboardingStatus.default_model_storage_path,
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
        model_storage_path: onboardingStatus.default_model_storage_path,
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
        featured_image_id: null,
        preview_image: null,
        last_synced_at: isoNow,
        missing_at: null,
      }

      projects.push(project)
      imagesByProject.set(projectId, [])
      refreshProjectPreview(projectId)

      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ project }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/projects/*', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback()
      return
    }

    const url = route.request().url()
    const match = /\/api\/projects\/([^/]+)$/.exec(url)
    const projectId = match?.[1]
    if (!projectId) {
      await route.fallback()
      return
    }

    const payload = JSON.parse(route.request().postData() ?? '{}') as {
      trigger_tag?: string
      class_tag?: string
      tagging_mode?: 'e621' | 'booru'
    }

    const projectIndex = projects.findIndex((project) => project.id === projectId)
    if (projectIndex === -1) {
      await route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({ detail: 'Project not found' }),
      })
      return
    }

    const currentProject = projects[projectIndex]
    if (!currentProject) {
      await route.fallback()
      return
    }

    const updatedProject: ProjectRecord = {
      ...currentProject,
      trigger_tag: payload.trigger_tag ?? currentProject.trigger_tag,
      class_tag: payload.class_tag ?? currentProject.class_tag,
      tagging_mode: payload.tagging_mode ?? currentProject.tagging_mode,
    }
    projects[projectIndex] = updatedProject

    for (const [key, detail] of imageDetails.entries()) {
      if (!key.startsWith(`${projectId}:`)) {
        continue
      }

      upsertProtectedTag(detail, 0, updatedProject.trigger_tag)
      upsertProtectedTag(detail, 1, updatedProject.class_tag)
      detail.tag_count = detail.tags.length
      imageDetails.set(key, detail)
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(updatedProject),
    })
  })

  await page.route('**/api/projects/*/featured-image/*', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const url = route.request().url()
    const match = /\/api\/projects\/([^/]+)\/featured-image\/([^/]+)$/.exec(url)
    const projectId = match?.[1]
    const imageId = match?.[2]
    if (!projectId || !imageId) {
      await route.fallback()
      return
    }

    const projectIndex = projects.findIndex((project) => project.id === projectId)
    if (projectIndex === -1) {
      await route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({ detail: 'Project not found' }),
      })
      return
    }

    const image = (imagesByProject.get(projectId) ?? []).find((candidate) => candidate.id === imageId)
    if (!image) {
      await route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({ detail: 'Project image not found' }),
      })
      return
    }

    const currentProject = projects[projectIndex]
    if (!currentProject) {
      await route.fallback()
      return
    }

    projects[projectIndex] = {
      ...currentProject,
      featured_image_id: image.id,
    }
    refreshProjectPreview(projectId)

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(projects[projectIndex]),
    })
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
      refreshProjectPreview(projectId)

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

    const detailKey = `${routeInfo.projectId}:${routeInfo.imageId}`

    if (route.request().method() === 'DELETE') {
      const projectImages = imagesByProject.get(routeInfo.projectId)
      if (projectImages) {
        imagesByProject.set(
          routeInfo.projectId,
          projectImages.filter((image) => image.id !== routeInfo.imageId),
        )
      }
      imageDetails.delete(detailKey)
      refreshProjectPreview(routeInfo.projectId)
      await route.fulfill({ status: 204 })
      return
    }

    const detail = imageDetails.get(detailKey)
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

  await page.route('**/api/projects/*/images/*/classify', async (route) => {
    const routeInfo = getProjectAndImageFromUrl(route.request().url())
    if (!routeInfo) {
      await route.fallback()
      return
    }

    const payload = JSON.parse(route.request().postData() ?? '{}') as {
      model_id?: string
    }

    const suggestionsByImageId: Record<string, Array<{ name: string; confidence: number }>> = {
      [defaultImageId]: [
        { name: 'blue_eyes', confidence: 0.92 },
        { name: 'smile', confidence: 0.87 },
      ],
      [secondImageId]: [
        { name: 'night', confidence: 0.9 },
        { name: 'city_lights', confidence: 0.82 },
      ],
      [thirdImageId]: [
        { name: 'running', confidence: 0.88 },
        { name: 'outdoors', confidence: 0.8 },
      ],
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        suggestions: suggestionsByImageId[routeInfo.imageId] ?? [
          { name: 'generic_tag', confidence: 0.7 },
        ],
        model_id: payload.model_id ?? 'jtp-3-hydra',
        model_available: true,
        download_progress_percent: 100,
        download_proposal_url: null,
        download_message: null,
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

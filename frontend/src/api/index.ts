import { z } from 'zod'

// ─── Schema definitions ──────────────────────────────────────────────────────

export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

export const ImageSummarySchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  original_name: z.string(),
  uploaded_at: z.string().datetime({ offset: true }),
  width: z.number().int(),
  height: z.number().int(),
  tag_count: z.number().int(),
})

export const ImageReadSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  original_name: z.string(),
  uploaded_at: z.string().datetime({ offset: true }),
  width: z.number().int(),
  height: z.number().int(),
  tags: z.array(TagSchema),
})

export const ImageUploadResponseSchema = z.object({
  id: z.string().uuid(),
  suggested_tags: z.array(z.string()),
})

export const ClassifyResponseSchema = z.object({
  suggested_tags: z.array(z.string()),
})

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  folder_name: z.string(),
  root_path: z.string(),
  dataset_path: z.string(),
  trigger_tag: z.string(),
  class_tag: z.string(),
  last_synced_at: z.string().datetime({ offset: true }).nullable(),
  missing_at: z.string().datetime({ offset: true }).nullable(),
})

export const ProjectDiscoverResponseSchema = z.object({
  discovered_projects: z.number().int(),
  imported_projects: z.number().int(),
  marked_missing_projects: z.number().int(),
})

export const ProjectSyncResponseSchema = z.object({
  project_id: z.string().uuid(),
  added_images: z.number().int(),
  removed_images: z.number().int(),
  restored_images: z.number().int(),
  missing: z.boolean(),
  synced_at: z.string().datetime({ offset: true }),
})

export const ProjectTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const ProjectImageSummarySchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  relative_path: z.string(),
  filename: z.string(),
  discovered_at: z.string().datetime({ offset: true }),
})

export const ProjectImageReadSchema = ProjectImageSummarySchema.extend({
  removed_at: z.string().datetime({ offset: true }).nullable(),
  tags: z.array(ProjectTagSchema),
})

export const ProjectImageTagUpdateSchema = z.object({
  add: z.array(z.string()),
  remove: z.array(z.string()),
})

export const ProjectUpdatePayloadSchema = z.object({
  trigger_tag: z.string().optional(),
  class_tag: z.string().optional(),
})

export const ProjectCreatePayloadSchema = z.object({
  folder_name: z.string().min(1),
  class_tag: z.string().min(1),
  name: z.string().optional(),
  trigger_tag: z.string().optional(),
})

export const ProjectCreateResponseSchema = z.object({
  project: ProjectSchema,
})

export const ProjectImageUploadResponseSchema = z.object({
  project_id: z.string().uuid(),
  uploaded_files: z.array(z.string()),
  created_records: z.number().int(),
  restored_records: z.number().int(),
})

// ─── Inferred types ──────────────────────────────────────────────────────────

export type Tag = z.infer<typeof TagSchema>
export type ImageSummary = z.infer<typeof ImageSummarySchema>
export type ImageRead = z.infer<typeof ImageReadSchema>
export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>
export type ClassifyResponse = z.infer<typeof ClassifyResponseSchema>
export type Project = z.infer<typeof ProjectSchema>
export type ProjectDiscoverResponse = z.infer<typeof ProjectDiscoverResponseSchema>
export type ProjectSyncResponse = z.infer<typeof ProjectSyncResponseSchema>
export type ProjectCreatePayload = z.infer<typeof ProjectCreatePayloadSchema>
export type ProjectCreateResponse = z.infer<typeof ProjectCreateResponseSchema>
export type ProjectImageUploadResponse = z.infer<typeof ProjectImageUploadResponseSchema>
export type ProjectImageSummary = z.infer<typeof ProjectImageSummarySchema>
export type ProjectImageRead = z.infer<typeof ProjectImageReadSchema>
export type ProjectUpdatePayload = z.infer<typeof ProjectUpdatePayloadSchema>

// ─── API client ──────────────────────────────────────────────────────────────

const BASE = '/api'

async function fetchJSON<T>(
  schema: z.ZodType<T>,
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }
  return schema.parse(await res.json())
}

// Images

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const form = new FormData()
  form.append('file', file)
  return fetchJSON(ImageUploadResponseSchema, `${BASE}/images`, {
    method: 'POST',
    body: form,
  })
}

export async function listImages(): Promise<ImageSummary[]> {
  return fetchJSON(z.array(ImageSummarySchema), `${BASE}/images`)
}

export async function getImage(id: string): Promise<ImageRead> {
  return fetchJSON(ImageReadSchema, `${BASE}/images/${id}`)
}

export function getImageFileUrl(id: string): string {
  return `${BASE}/images/${id}/file`
}

export async function updateImageTags(
  id: string,
  add: string[],
  remove: string[],
): Promise<ImageRead> {
  return fetchJSON(ImageReadSchema, `${BASE}/images/${id}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ add, remove }),
  })
}

// Tags

export async function listTags(): Promise<Tag[]> {
  return fetchJSON(z.array(TagSchema), `${BASE}/tags`)
}

export async function createTag(name: string, category?: string): Promise<Tag> {
  return fetchJSON(TagSchema, `${BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category: category ?? null }),
  })
}

// Classify

export async function classifyImage(file: File): Promise<ClassifyResponse> {
  const form = new FormData()
  form.append('file', file)
  return fetchJSON(ClassifyResponseSchema, `${BASE}/classify`, {
    method: 'POST',
    body: form,
  })
}

// Projects

export async function listProjects(): Promise<Project[]> {
  return fetchJSON(z.array(ProjectSchema), `${BASE}/projects`)
}

export async function discoverProjects(): Promise<ProjectDiscoverResponse> {
  return fetchJSON(ProjectDiscoverResponseSchema, `${BASE}/projects/discover`, {
    method: 'POST',
  })
}

export async function syncProject(projectId: string): Promise<ProjectSyncResponse> {
  return fetchJSON(ProjectSyncResponseSchema, `${BASE}/projects/${projectId}/sync`, {
    method: 'POST',
  })
}

export async function createProject(payload: ProjectCreatePayload): Promise<ProjectCreateResponse> {
  return fetchJSON(ProjectCreateResponseSchema, `${BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function uploadProjectImages(
  projectId: string,
  files: File[],
): Promise<ProjectImageUploadResponse> {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }

  return fetchJSON(ProjectImageUploadResponseSchema, `${BASE}/projects/${projectId}/images`, {
    method: 'POST',
    body: form,
  })
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdatePayload,
): Promise<Project> {
  return fetchJSON(ProjectSchema, `${BASE}/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function listProjectImages(projectId: string): Promise<ProjectImageSummary[]> {
  return fetchJSON(z.array(ProjectImageSummarySchema), `${BASE}/projects/${projectId}/images`)
}

export async function getProjectImage(projectId: string, imageId: string): Promise<ProjectImageRead> {
  return fetchJSON(ProjectImageReadSchema, `${BASE}/projects/${projectId}/images/${imageId}`)
}

export function getProjectImageFileUrl(projectId: string, imageId: string): string {
  return `${BASE}/projects/${projectId}/images/${imageId}/file`
}

export async function updateProjectImageTags(
  projectId: string,
  imageId: string,
  add: string[],
  remove: string[],
): Promise<ProjectImageRead> {
  return fetchJSON(ProjectImageReadSchema, `${BASE}/projects/${projectId}/images/${imageId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ProjectImageTagUpdateSchema.parse({ add, remove })),
  })
}

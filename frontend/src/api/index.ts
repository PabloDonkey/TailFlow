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

// ─── Inferred types ──────────────────────────────────────────────────────────

export type Tag = z.infer<typeof TagSchema>
export type ImageSummary = z.infer<typeof ImageSummarySchema>
export type ImageRead = z.infer<typeof ImageReadSchema>
export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>
export type ClassifyResponse = z.infer<typeof ClassifyResponseSchema>
export type Project = z.infer<typeof ProjectSchema>
export type ProjectDiscoverResponse = z.infer<typeof ProjectDiscoverResponseSchema>
export type ProjectSyncResponse = z.infer<typeof ProjectSyncResponseSchema>

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

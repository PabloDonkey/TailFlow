import { describe, it, expect } from 'vitest'
import {
  TagSchema,
  ProjectSchema,
  ProjectDiscoverResponseSchema,
  ProjectSyncResponseSchema,
  ProjectCreateResponseSchema,
  ProjectImageUploadResponseSchema,
  ProjectImageSummarySchema,
  ProjectImageReadSchema,
  ProjectOnboardingConfigureResponseSchema,
  ProjectOnboardingStatusSchema,
  ProjectUpdatePayloadSchema,
} from '../api'

describe('API schemas', () => {
  it('parses a valid Tag', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'cat',
      category: 'animal',
      created_at: '2026-01-01T00:00:00Z',
    }
    const tag = TagSchema.parse(raw)
    expect(tag.name).toBe('cat')
    expect(tag.category).toBe('animal')
  })

  it('parses a Tag with null category', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'misc',
      category: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    const tag = TagSchema.parse(raw)
    expect(tag.category).toBeNull()
  })

  it('rejects an invalid UUID', () => {
    expect(() =>
      TagSchema.parse({
        id: 'not-a-uuid',
        name: 'x',
        category: null,
        created_at: '2026-01-01T00:00:00Z',
      })
    ).toThrow()
  })

  it('parses Project metadata', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'project-a',
      folder_name: 'project-a',
      root_path: '/tmp/projects',
      dataset_path: '/tmp/projects/project-a/dataset',
      trigger_tag: 'project-a',
      class_tag: 'character',
      last_synced_at: '2026-01-01T00:00:00Z',
      missing_at: null,
    }
    const project = ProjectSchema.parse(raw)
    expect(project.folder_name).toBe('project-a')
    expect(project.missing_at).toBeNull()
  })

  it('parses project discover response', () => {
    const raw = {
      discovered_projects: 3,
      imported_projects: 1,
      marked_missing_projects: 1,
    }
    const result = ProjectDiscoverResponseSchema.parse(raw)
    expect(result.discovered_projects).toBe(3)
  })

  it('parses project sync response', () => {
    const raw = {
      project_id: '550e8400-e29b-41d4-a716-446655440011',
      added_images: 2,
      removed_images: 1,
      restored_images: 0,
      missing: false,
      synced_at: '2026-01-01T00:00:00Z',
    }
    const result = ProjectSyncResponseSchema.parse(raw)
    expect(result.added_images).toBe(2)
    expect(result.missing).toBe(false)
  })

  it('parses project create response', () => {
    const raw = {
      project: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'project-new',
        folder_name: 'project-new',
        root_path: '/tmp/projects',
        dataset_path: '/tmp/projects/project-new/dataset',
        trigger_tag: 'project-new',
        class_tag: 'style',
        last_synced_at: null,
        missing_at: null,
      },
    }

    const result = ProjectCreateResponseSchema.parse(raw)
    expect(result.project.folder_name).toBe('project-new')
  })

  it('parses project image upload response', () => {
    const raw = {
      project_id: '550e8400-e29b-41d4-a716-446655440013',
      uploaded_files: ['a.png', 'b.jpg'],
      created_records: 2,
      restored_records: 0,
    }

    const result = ProjectImageUploadResponseSchema.parse(raw)
    expect(result.uploaded_files).toHaveLength(2)
  })

  it('parses project image summary and read payloads', () => {
    const summary = ProjectImageSummarySchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440014',
      project_id: '550e8400-e29b-41d4-a716-446655440015',
      relative_path: 'dataset/a.png',
      filename: 'a.png',
      discovered_at: '2026-01-01T00:00:00Z',
    })
    expect(summary.filename).toBe('a.png')

    const read = ProjectImageReadSchema.parse({
      ...summary,
      removed_at: null,
      tags: [{ id: '550e8400-e29b-41d4-a716-446655440016', name: 'portrait' }],
    })
    expect(read.tags[0]?.name).toBe('portrait')
  })

  it('parses project update payload', () => {
    const payload = ProjectUpdatePayloadSchema.parse({
      trigger_tag: 'trigger-x',
      class_tag: 'class-y',
    })
    expect(payload.trigger_tag).toBe('trigger-x')
  })

  it('parses onboarding status response', () => {
    const status = ProjectOnboardingStatusSchema.parse({
      configured: false,
      projects_root_path: null,
      default_projects_root_path: '/home/user/tailflow',
    })
    expect(status.configured).toBe(false)
    expect(status.projects_root_path).toBeNull()
  })

  it('parses onboarding configure response', () => {
    const payload = ProjectOnboardingConfigureResponseSchema.parse({
      projects_root_path: '/home/user/tailflow',
    })
    expect(payload.projects_root_path).toBe('/home/user/tailflow')
  })
})

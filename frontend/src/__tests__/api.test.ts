import { describe, it, expect } from 'vitest'
import {
  TagSchema,
  ImageSummarySchema,
  ImageReadSchema,
  ImageUploadResponseSchema,
  ProjectSchema,
  ProjectDiscoverResponseSchema,
  ProjectSyncResponseSchema,
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

  it('parses ImageSummary', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      filename: 'abc.png',
      original_name: 'photo.png',
      uploaded_at: '2026-01-01T12:00:00Z',
      width: 100,
      height: 200,
      tag_count: 3,
    }
    const summary = ImageSummarySchema.parse(raw)
    expect(summary.tag_count).toBe(3)
  })

  it('parses ImageRead with tags', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      filename: 'xyz.png',
      original_name: 'img.png',
      uploaded_at: '2026-01-01T12:00:00Z',
      width: 50,
      height: 50,
      tags: [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'dog',
          category: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    }
    const image = ImageReadSchema.parse(raw)
    expect(image.tags).toHaveLength(1)
    const firstTag = image.tags[0]
    expect(firstTag).toBeDefined()
    expect(firstTag?.name).toBe('dog')
  })

  it('parses ImageUploadResponse', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      suggested_tags: ['cat', 'fluffy'],
    }
    const result = ImageUploadResponseSchema.parse(raw)
    expect(result.suggested_tags).toEqual(['cat', 'fluffy'])
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
})

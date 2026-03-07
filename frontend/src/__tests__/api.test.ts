import { describe, it, expect } from 'vitest'
import {
  TagSchema,
  ImageSummarySchema,
  ImageReadSchema,
  ImageUploadResponseSchema,
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
})

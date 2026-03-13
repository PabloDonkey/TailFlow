import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageStore } from '../stores/images'

vi.mock('../api', () => ({
  listProjectImages: vi.fn(),
  getProjectImage: vi.fn(),
  updateProjectImageTags: vi.fn(),
}))

import * as api from '../api'

describe('useImageStore – updateTags patches images in-place', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('updates tag_count, filename, and relative_path in images after a successful tag update', async () => {
    const store = useImageStore()

    store.images = [
      {
        id: 'img-1',
        project_id: 'proj-1',
        relative_path: 'old/path.png',
        filename: 'old.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 1,
      },
      {
        id: 'img-2',
        project_id: 'proj-1',
        relative_path: 'other.png',
        filename: 'other.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 0,
      },
    ]

    const updatedImage = {
      id: 'img-1',
      project_id: 'proj-1',
      relative_path: 'new/path.png',
      filename: 'new.png',
      discovered_at: '2026-01-01T00:00:00Z',
      tag_count: 3,
      removed_at: null,
      tags: [],
    }

    vi.mocked(api.updateProjectImageTags).mockResolvedValue(updatedImage)

    const result = await store.updateTags('proj-1', 'img-1', ['tag-a'], [])

    expect(result).toStrictEqual(updatedImage)
    expect(store.currentImage).toStrictEqual(updatedImage)

    // The matching entry in images should be patched in-place
    const patched = store.images.find((img) => img.id === 'img-1')
    expect(patched?.tag_count).toBe(3)
    expect(patched?.filename).toBe('new.png')
    expect(patched?.relative_path).toBe('new/path.png')

    // Unrelated image should be untouched
    const other = store.images.find((img) => img.id === 'img-2')
    expect(other?.tag_count).toBe(0)
  })

  it('does not mutate images when the image id is not in images', async () => {
    const store = useImageStore()

    store.images = [
      {
        id: 'img-99',
        project_id: 'proj-1',
        relative_path: 'foo.png',
        filename: 'foo.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 0,
      },
    ]

    const updatedImage = {
      id: 'img-unknown',
      project_id: 'proj-1',
      relative_path: 'bar.png',
      filename: 'bar.png',
      discovered_at: '2026-01-01T00:00:00Z',
      tag_count: 5,
      removed_at: null,
      tags: [],
    }

    vi.mocked(api.updateProjectImageTags).mockResolvedValue(updatedImage)

    await store.updateTags('proj-1', 'img-unknown', ['tag-a'], [])

    expect(store.images[0]?.tag_count).toBe(0)
  })
})

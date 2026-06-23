import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'

type TestImageSummary = {
  id: string
  filename: string
  relative_path: string
  project_id: string
  discovered_at: string
  tag_count: number
  content_hash: string | null
}

type TestImageRead = TestImageSummary & {
  removed_at: string | null
  tags: unknown[]
}

type TestImageStore = {
  images: TestImageSummary[]
  currentImage: TestImageRead | null
  sortedImages: TestImageSummary[]
  fetchImages: ReturnType<typeof vi.fn>
  fetchImage: ReturnType<typeof vi.fn>
  deleteImage: ReturnType<typeof vi.fn>
}

function createTestImageStore(currentImageId = 'a'): TestImageStore {
  const storeState = reactive<{
    images: TestImageSummary[]
    currentImage: TestImageRead | null
  }>({
    images: [
      {
        id: 'a',
        filename: 'a.png',
        relative_path: 'a.png',
        project_id: '11111111-1111-1111-1111-111111111111',
        discovered_at: new Date().toISOString(),
        tag_count: 0,
        content_hash: null,
      },
      {
        id: 'b',
        filename: 'b.png',
        relative_path: 'b.png',
        project_id: '11111111-1111-1111-1111-111111111111',
        discovered_at: new Date().toISOString(),
        tag_count: 0,
        content_hash: null,
      },
    ],
    currentImage: {
      id: currentImageId,
      filename: `${currentImageId}.png`,
      relative_path: `${currentImageId}.png`,
      project_id: '11111111-1111-1111-1111-111111111111',
      discovered_at: new Date().toISOString(),
      tag_count: 0,
      removed_at: null,
      tags: [],
      content_hash: null,
    },
  })

  const fetchImages = vi.fn().mockResolvedValue(undefined)
  const fetchImage = vi.fn().mockResolvedValue(undefined)
  const deleteImage = vi.fn(async (_projectId: string, imageId: string) => {
    storeState.images = storeState.images.filter((image: TestImageSummary) => image.id !== imageId)
    if (storeState.currentImage?.id === imageId) {
      storeState.currentImage = null
    }
    return true
  })

  return {
    get images() {
      if (storeState.currentImage?.id === 'ghost') {
        return [
          ...storeState.images,
          {
            id: 'ghost',
            filename: 'ghost.png',
            relative_path: 'ghost.png',
            project_id: '11111111-1111-1111-1111-111111111111',
            discovered_at: new Date().toISOString(),
            tag_count: 0,
            content_hash: null,
          },
        ]
      }
      return storeState.images
    },
    set images(value: TestImageSummary[]) {
      storeState.images = value
    },
    get currentImage() {
      return storeState.currentImage
    },
    set currentImage(value: TestImageRead | null) {
      storeState.currentImage = value
    },
    get sortedImages() {
      return storeState.images
    },
    fetchImages,
    fetchImage,
    deleteImage,
  }
}

describe('useWorkspaceImages delete flow', () => {
  it('selects the next available image after deleting current image', async () => {
    const projectStore = reactive({
      selectedProjectId: '11111111-1111-1111-1111-111111111111' as string | null,
      projects: [{ id: '11111111-1111-1111-1111-111111111111' }],
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    })

    const imageStore = createTestImageStore('a')

    let composableApi: ReturnType<typeof useWorkspaceImages> | null = null

    const Harness = defineComponent({
      setup() {
        composableApi = useWorkspaceImages({
          projectStore: projectStore as never,
          imageStore: imageStore as never,
        })
        return () => null
      },
    })

    mount(Harness)
    await flushPromises()

    await composableApi!.deleteCurrentImage()

    expect(imageStore.deleteImage).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'a')
    expect(imageStore.fetchImage).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'b')
  })

  it('falls back to first available image when current image is missing from sorted images', async () => {
    const projectStore = reactive({
      selectedProjectId: '11111111-1111-1111-1111-111111111111' as string | null,
      projects: [{ id: '11111111-1111-1111-1111-111111111111' }],
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    })

    const imageStore = createTestImageStore('ghost')

    let composableApi: ReturnType<typeof useWorkspaceImages> | null = null

    const Harness = defineComponent({
      setup() {
        composableApi = useWorkspaceImages({
          projectStore: projectStore as never,
          imageStore: imageStore as never,
        })
        return () => null
      },
    })

    mount(Harness)
    await flushPromises()

    await composableApi!.deleteCurrentImage()

    expect(imageStore.fetchImage).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'a')
  })
})
import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'

describe('useWorkspaceImages delete flow', () => {
  it('selects the next available image after deleting current image', async () => {
    const projectStore = reactive({
      selectedProjectId: '11111111-1111-1111-1111-111111111111' as string | null,
      projects: [{ id: '11111111-1111-1111-1111-111111111111' }],
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    })

    const imageStore = reactive({
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
        id: 'a',
        filename: 'a.png',
        relative_path: 'a.png',
        project_id: '11111111-1111-1111-1111-111111111111',
        discovered_at: new Date().toISOString(),
        tag_count: 0,
        removed_at: null,
        tags: [],
        content_hash: null,
      },
      sortedImages: computed(() => imageStore.images),
      fetchImages: vi.fn().mockResolvedValue(undefined),
      fetchImage: vi.fn().mockResolvedValue(undefined),
      deleteImage: vi.fn(async (_projectId: string, imageId: string) => {
        imageStore.images = imageStore.images.filter((image) => image.id !== imageId)
        if (imageStore.currentImage?.id === imageId) {
          imageStore.currentImage = null
        }
        return true
      }),
    })

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
})
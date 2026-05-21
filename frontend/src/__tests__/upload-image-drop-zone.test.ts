import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UploadImageDropZone from '../components/ui/UploadImageDropZone.vue'

const mocks = vi.hoisted(() => ({
  dropOptions: null as {
    afterUpload?: (projectId: string) => Promise<void>
  } | null,
  imageStore: {
    currentImage: null,
    sortedImages: [] as Array<{ id: string }>,
    fetchImages: vi.fn().mockResolvedValue(undefined),
    fetchImage: vi.fn().mockResolvedValue(undefined),
  },
  projectStore: {
    uploadImagesToProject: vi.fn().mockResolvedValue({
      project_id: '11111111-1111-1111-1111-111111111111',
      uploaded_files: ['sample.png'],
      created_records: 1,
      restored_records: 0,
    }),
  },
}))

vi.mock('../stores/images', () => ({
  useImageStore: () => mocks.imageStore,
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

vi.mock('../composables/useProjectImageDrop', () => ({
  hasExternalImageDropPayload: () => true,
  useProjectImageDrop: (options: unknown) => {
    mocks.dropOptions = options as { afterUpload?: (projectId: string) => Promise<void> }
    return {
      isDropActive: ref(false),
      dropFeedback: ref(null),
      dropFeedbackTone: ref('info'),
      clearFeedback: vi.fn(),
      handleDropZoneDragEnter: vi.fn(),
      handleDropZoneDragOver: vi.fn(),
      handleDropZoneDragLeave: vi.fn(),
      handleDropZoneDrop: vi.fn(),
    }
  },
}))

describe('UploadImageDropZone', () => {
  beforeEach(() => {
    mocks.dropOptions = null
    mocks.imageStore.fetchImages.mockClear()
    mocks.imageStore.fetchImage.mockClear()
    mocks.projectStore.uploadImagesToProject.mockClear()
  })

  it('emits uploaded after drop afterUpload callback resolves', async () => {
    const wrapper = mount(UploadImageDropZone, {
      props: {
        projectId: '11111111-1111-1111-1111-111111111111',
        existingFilenames: [],
      },
      slots: {
        default: '<template #default="slotProps"><div data-testid="slot-root">{{ String(slotProps.isDropActive) }}</div></template>',
      },
    })

    expect(mocks.dropOptions?.afterUpload).toBeDefined()
    await mocks.dropOptions!.afterUpload?.('11111111-1111-1111-1111-111111111111')

    await flushPromises()

    expect(mocks.imageStore.fetchImages).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
    expect(wrapper.emitted('uploaded')?.[0]).toEqual(['11111111-1111-1111-1111-111111111111'])
  })
})
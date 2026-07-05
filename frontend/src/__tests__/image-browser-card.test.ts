import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ImageBrowserCard from '../cards/image-browser/ImageBrowserCard.vue'

type MockImageSummary = {
  id: string
  filename: string
  relative_path: string
  content_hash: string | null
  tag_count: number
  discovered_at: string
}

const mocks = vi.hoisted(() => ({
  imageStore: {
    images: [] as MockImageSummary[],
    sortedImages: [] as MockImageSummary[],
    imagesLoading: false,
    error: null as string | null,
    sortOption: 'name-asc' as 'name-asc' | 'name-desc' | 'tag-count-asc' | 'tag-count-desc',
  },
  getProjectImageFileUrl: vi.fn().mockReturnValue('/api/projects/image.png'),
}))

vi.mock('../stores/images', () => ({
  useImageStore: () => mocks.imageStore,
}))

vi.mock('../api', () => ({
  getProjectImageFileUrl: mocks.getProjectImageFileUrl,
}))

vi.mock('../composables/useDelayedLoading', () => ({
  useDelayedLoading: (source: { value: boolean }) => source,
}))

describe('ImageBrowserCard', () => {
  beforeEach(() => {
    mocks.imageStore.images = []
    mocks.imageStore.sortedImages = []
    mocks.imageStore.imagesLoading = false
    mocks.imageStore.error = null
    mocks.imageStore.sortOption = 'name-asc'
    mocks.getProjectImageFileUrl.mockClear()
  })

  it('shows Upload Image button only when selected project has zero images', async () => {
    const emptyWrapper = mount(ImageBrowserCard, {
      props: {
        selectedProjectId: '11111111-1111-1111-1111-111111111111',
      },
      global: {
        stubs: {
          UploadImageDropZone: {
            template: '<div><slot :is-drop-active="false" :drop-feedback="null" drop-feedback-tone="info" /></div>',
          },
        },
      },
    })

    expect(emptyWrapper.findAll('button').some((button) => button.text().includes('Upload Image'))).toBe(true)

    mocks.imageStore.images = [
      {
        id: 'img-1',
        filename: '1.png',
        relative_path: '1.png',
        content_hash: null,
        tag_count: 0,
        discovered_at: '2026-07-04T00:00:00+00:00',
      },
    ]
    mocks.imageStore.sortedImages = [...mocks.imageStore.images]

    const populatedWrapper = mount(ImageBrowserCard, {
      props: {
        selectedProjectId: '11111111-1111-1111-1111-111111111111',
      },
      global: {
        stubs: {
          UploadImageDropZone: {
            template: '<div><slot :is-drop-active="false" :drop-feedback="null" drop-feedback-tone="info" /></div>',
          },
        },
      },
    })

    expect(populatedWrapper.findAll('button').some((button) => button.text().includes('Upload Image'))).toBe(false)
  })

  it('emits uploadImages when selecting files from empty-state picker', async () => {
    const wrapper = mount(ImageBrowserCard, {
      props: {
        selectedProjectId: '11111111-1111-1111-1111-111111111111',
      },
      global: {
        stubs: {
          UploadImageDropZone: {
            template: '<div><slot :is-drop-active="false" :drop-feedback="null" drop-feedback-tone="info" /></div>',
          },
        },
      },
    })

    const input = wrapper.get('input[type="file"]')
    const file = new File(['image-bytes'], 'first.png', { type: 'image/png' })

    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [file],
    })
    await input.trigger('change')

    expect(wrapper.emitted('uploadImages')?.[0]).toEqual([[file]])
  })

  it('shows Upload Image button again after the last image is removed', async () => {
    mocks.imageStore.images = [
      {
        id: 'img-1',
        filename: '1.png',
        relative_path: '1.png',
        content_hash: null,
        tag_count: 0,
        discovered_at: '2026-07-04T00:00:00+00:00',
      },
    ]
    mocks.imageStore.sortedImages = [...mocks.imageStore.images]

    const wrapper = mount(ImageBrowserCard, {
      props: {
        selectedProjectId: '11111111-1111-1111-1111-111111111111',
      },
      global: {
        stubs: {
          UploadImageDropZone: {
            template: '<div><slot :is-drop-active="false" :drop-feedback="null" drop-feedback-tone="info" /></div>',
          },
        },
      },
    })

    expect(wrapper.findAll('button').some((button) => button.text().includes('Upload Image'))).toBe(false)

    mocks.imageStore.images = []
    mocks.imageStore.sortedImages = []
    wrapper.vm.$forceUpdate()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('button').some((button) => button.text().includes('Upload Image'))).toBe(true)
  })
})

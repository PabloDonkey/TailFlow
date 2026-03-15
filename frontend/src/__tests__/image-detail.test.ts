import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ImageDetailPage from '../pages/ImageDetailPage.vue'

function compareImages(
  a: { filename: string; tag_count: number },
  b: { filename: string; tag_count: number },
  sortOption: string,
): number {
  const compareByName = (left: { filename: string }, right: { filename: string }) =>
    left.filename.localeCompare(right.filename, undefined, {
      numeric: true,
      sensitivity: 'base',
    })

  switch (sortOption) {
    case 'name-desc':
      return compareByName(b, a)
    case 'tag-count-asc':
      return a.tag_count - b.tag_count || compareByName(a, b)
    case 'tag-count-desc':
      return b.tag_count - a.tag_count || compareByName(a, b)
    case 'name-asc':
    default:
      return compareByName(a, b)
  }
}

const mocks = vi.hoisted(() => ({
  route: {
    params: { id: 'image-1' },
    query: { project: 'project-1' },
  },
  imageStore: {
    images: [
      {
        id: 'image-0',
        project_id: 'project-1',
        relative_path: 'prev.png',
        filename: 'alpha.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 1,
      },
      {
        id: 'image-1',
        project_id: 'project-1',
        relative_path: 'fox.png',
        filename: 'fox.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 2,
      },
      {
        id: 'image-2',
        project_id: 'project-1',
        relative_path: 'next.png',
        filename: 'zebra.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 4,
      },
    ],
    get sortedImages() {
      return [...this.images].sort((a, b) => compareImages(a, b, this.sortOption))
    },
    currentImage: {
      id: 'image-1',
      project_id: 'project-1',
      relative_path: 'fox.png',
      filename: 'fox.png',
      discovered_at: '2026-01-01T00:00:00Z',
      tag_count: 2,
      removed_at: null,
      tags: [
        {
          id: 'tag-1',
          name: 'trigger-tag',
          catalog_ids: {},
          category: null,
          position: 0,
          is_protected: true,
        },
        {
          id: 'tag-2',
          name: 'style-tag',
          catalog_ids: { booru: '42' },
          category: 'general',
          position: 2,
          is_protected: false,
        },
      ],
    },
    loading: false,
    error: null as string | null,
    sortOption: 'name-asc',
    fetchImages: vi.fn().mockResolvedValue(undefined),
    fetchImage: vi.fn().mockResolvedValue(undefined),
    updateTags: vi.fn(),
  },
  projectStore: {
    projects: [{ id: 'project-1', tagging_mode: 'booru' }],
    selectedProjectId: 'project-1',
    selectedProject: { id: 'project-1', tagging_mode: 'booru' },
    fetchProjects: vi.fn().mockResolvedValue(undefined),
    selectProject: vi.fn(),
  },
  router: {
    push: vi.fn(),
  },
  getProjectImageFileUrl: vi.fn().mockReturnValue('/api/projects/project-1/images/image-1/file'),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('../stores/images', () => ({
  useImageStore: () => mocks.imageStore,
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return {
    ...actual,
    getProjectImageFileUrl: mocks.getProjectImageFileUrl,
  }
})

describe('ImageDetailPage', () => {
  beforeEach(() => {
    mocks.imageStore.error = null
    mocks.imageStore.sortOption = 'name-asc'
    mocks.imageStore.fetchImages.mockClear()
    mocks.imageStore.fetchImage.mockClear()
    mocks.imageStore.updateTags.mockReset()
    mocks.projectStore.fetchProjects.mockClear()
    mocks.projectStore.selectProject.mockClear()
    mocks.router.push.mockClear()
  })

  it('renders protected tags, navigation, and tag count', async () => {
    const wrapper = mount(ImageDetailPage)
    await flushPromises()

    expect(mocks.imageStore.fetchImage).toHaveBeenCalledWith('project-1', 'image-1')
    const removeButtons = wrapper.findAll('button[aria-label="Remove tag"]')
    expect(removeButtons).toHaveLength(1)
    expect(removeButtons[0]?.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Trigger')
    expect(wrapper.text()).toContain('booru')
    expect(wrapper.text()).toContain('Tag Inspector')
    expect(wrapper.text()).toContain('Image tags: 2 tags')
    expect(wrapper.text()).not.toContain('shared')
    expect(wrapper.text()).toContain('of 3')
    expect(
      (wrapper.get('[data-testid="image-number-input"]').element as HTMLInputElement).value,
    ).toBe('1')

    await wrapper.get('[data-testid="previous-image-button"]').trigger('click')
    await wrapper.get('[data-testid="next-image-button"]').trigger('click')
    await wrapper.get('[data-testid="image-number-input"]').setValue('3')
    await wrapper.get('[data-testid="image-number-input"]').trigger('keyup.enter')

    expect(mocks.router.push).toHaveBeenNthCalledWith(1, {
      path: '/image/image-0',
      query: { project: 'project-1' },
    })
    expect(mocks.router.push).toHaveBeenNthCalledWith(2, {
      path: '/image/image-2',
      query: { project: 'project-1' },
    })
    expect(mocks.router.push).toHaveBeenNthCalledWith(3, {
      path: '/image/image-2',
      query: { project: 'project-1' },
    })
  })

  it('confirms and retries unknown tag creation', async () => {
    const confirmSpy = vi.fn(() => true)
    Object.defineProperty(window, 'confirm', {
      value: confirmSpy,
      configurable: true,
      writable: true,
    })
    mocks.imageStore.updateTags
      .mockImplementationOnce(async () => {
        mocks.imageStore.error = 'Error: API 422: {"detail":"Tag "new-shared" does not exist. Confirm creation before adding it as a shared tag."}'
        return null
      })
      .mockImplementationOnce(async () => {
        mocks.imageStore.error = null
        return mocks.imageStore.currentImage
      })

    const wrapper = mount(ImageDetailPage)
    await flushPromises()

    await wrapper.get('[data-testid="add-tag-input"]').setValue('new-shared')
    await wrapper.get('button.btn.btn-primary').trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mocks.imageStore.updateTags).toHaveBeenNthCalledWith(
      1,
      'project-1',
      'image-1',
      ['new-shared'],
      [],
    )
    expect(mocks.imageStore.updateTags).toHaveBeenNthCalledWith(
      2,
      'project-1',
      'image-1',
      ['new-shared'],
      [],
      true,
    )
  })
})

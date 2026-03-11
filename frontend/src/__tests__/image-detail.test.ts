import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ImageDetailPage from '../pages/ImageDetailPage.vue'

const mocks = vi.hoisted(() => ({
  route: {
    params: { id: 'image-1' },
    query: { project: 'project-1' },
  },
  imageStore: {
    currentImage: {
      id: 'image-1',
      project_id: 'project-1',
      relative_path: 'fox.png',
      filename: 'fox.png',
      discovered_at: '2026-01-01T00:00:00Z',
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
  getProjectImageFileUrl: vi.fn().mockReturnValue('/api/projects/project-1/images/image-1/file'),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
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
    mocks.imageStore.fetchImage.mockClear()
    mocks.imageStore.updateTags.mockReset()
    mocks.projectStore.fetchProjects.mockClear()
    mocks.projectStore.selectProject.mockClear()
  })

  it('renders protected tags as non-removable', async () => {
    const wrapper = mount(ImageDetailPage)
    await flushPromises()

    expect(mocks.imageStore.fetchImage).toHaveBeenCalledWith('project-1', 'image-1')
    const removeButtons = wrapper.findAll('button[aria-label="Remove tag"]')
    expect(removeButtons[0]?.attributes('disabled')).toBeDefined()
    expect(removeButtons[1]?.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Trigger')
    expect(wrapper.text()).toContain('booru')
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
        mocks.imageStore.error = 'Error: API 422: {"detail":"Tag \"new-shared\" does not exist. Confirm creation before adding it as a shared tag."}'
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
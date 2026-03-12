import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GalleryPage from '../pages/GalleryPage.vue'

const mocks = vi.hoisted(() => ({
  imageStore: {
    images: [
      {
        id: 'image-1',
        project_id: 'project-1',
        relative_path: 'nested/fox.png',
        filename: 'fox.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 3,
      },
    ],
    loading: false,
    error: null as string | null,
    fetchImages: vi.fn().mockResolvedValue(undefined),
  },
  projectStore: {
    selectedProjectId: 'project-1',
    projects: [{ id: 'project-1' }],
    fetchProjects: vi.fn().mockResolvedValue(undefined),
  },
  router: {
    push: vi.fn(),
  },
  getProjectImageFileUrl: vi.fn().mockReturnValue('/api/projects/project-1/images/image-1/file'),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => mocks.router,
  }
})

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

describe('GalleryPage', () => {
  beforeEach(() => {
    mocks.imageStore.fetchImages.mockClear()
    mocks.projectStore.fetchProjects.mockClear()
    mocks.router.push.mockClear()
  })

  it('shows tag counts without duplicating the image path', async () => {
    const wrapper = mount(GalleryPage, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })
    await flushPromises()

    expect(mocks.imageStore.fetchImages).toHaveBeenCalledWith('project-1')
    expect(wrapper.get('.name').text()).toBe('fox.png')
    expect(wrapper.get('.tag-count').text()).toBe('3 tags')
    expect(wrapper.text()).not.toContain('nested/fox.png')

    await wrapper.get('.card').trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith({
      path: '/image/image-1',
      query: { project: 'project-1' },
    })
  })
})

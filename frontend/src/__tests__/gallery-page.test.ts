import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GalleryPage from '../pages/GalleryPage.vue'

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
  imageStore: {
    images: [
      {
        id: 'image-1',
        project_id: 'project-1',
        relative_path: 'nested/zebra.png',
        filename: 'zebra.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 3,
      },
      {
        id: 'image-2',
        project_id: 'project-1',
        relative_path: 'nested/alpha.png',
        filename: 'alpha.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 1,
      },
      {
        id: 'image-3',
        project_id: 'project-1',
        relative_path: 'nested/fox.png',
        filename: 'fox.png',
        discovered_at: '2026-01-01T00:00:00Z',
        tag_count: 5,
      },
    ],
    loading: false,
    error: null as string | null,
    sortOption: 'name-asc',
    get sortedImages() {
      return [...this.images].sort((a, b) => compareImages(a, b, this.sortOption))
    },
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

vi.mock('../stores/projects', async () => {
  const { reactive } = await vi.importActual<typeof import('vue')>('vue')
  return {
    useProjectStore: () => reactive(mocks.projectStore),
  }
})

vi.mock('../stores/images', async () => {
  const { reactive } = await vi.importActual<typeof import('vue')>('vue')
  return {
    useImageStore: () => reactive(mocks.imageStore),
  }
})

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return {
    ...actual,
    getProjectImageFileUrl: mocks.getProjectImageFileUrl,
  }
})

describe('GalleryPage', () => {
  beforeEach(() => {
    mocks.imageStore.sortOption = 'name-asc'
    mocks.imageStore.fetchImages.mockClear()
    mocks.projectStore.fetchProjects.mockClear()
    mocks.router.push.mockClear()
  })

  it('defaults to name ordering and lets users change gallery sorting', async () => {
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
    const names = wrapper.findAll('.name').map((node) => node.text())
    const tagCounts = wrapper.findAll('.tag-count').map((node) => node.text())
    expect(names).toEqual(['alpha.png', 'fox.png', 'zebra.png'])
    expect(tagCounts).toEqual(['1 tag', '5 tags', '3 tags'])
    expect(wrapper.text()).not.toContain('nested/fox.png')

    await wrapper.get('[data-testid="gallery-sort"]').setValue('tag-count-asc')
    expect(wrapper.findAll('.name').map((node) => node.text())).toEqual([
      'alpha.png',
      'zebra.png',
      'fox.png',
    ])

    await wrapper.get('[data-testid="gallery-sort"]').setValue('name-desc')
    expect(wrapper.findAll('.name').map((node) => node.text())).toEqual([
      'zebra.png',
      'fox.png',
      'alpha.png',
    ])

    await wrapper.get('.card').trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith({
      path: '/image/image-1',
      query: { project: 'project-1' },
    })
  })
})

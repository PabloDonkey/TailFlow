import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ImageDetailPage from '../pages/ImageDetailPage.vue'

const mocks = vi.hoisted(() => ({
  route: {
    params: {
      id: 'image-9',
    },
    query: {
      project: 'project-1',
    },
  },
  router: {
    replace: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

describe('ImageDetailPage compatibility shim', () => {
  beforeEach(() => {
    mocks.router.replace.mockClear()
  })

  it('redirects to workspace image context and preserves project query', async () => {
    const wrapper = mount(ImageDetailPage)
    await flushPromises()

    expect(mocks.router.replace).toHaveBeenCalledWith({
      path: '/workspace',
      query: {
        project: 'project-1',
        image: 'image-9',
      },
    })
    expect(wrapper.get('[data-testid="legacy-image-detail-redirect"]').text()).toContain(
      'Redirecting',
    )
  })
})

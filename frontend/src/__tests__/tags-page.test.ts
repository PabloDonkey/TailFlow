import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TagsPage from '../pages/TagsPage.vue'

const mocks = vi.hoisted(() => ({
  route: {
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

describe('TagsPage compatibility shim', () => {
  beforeEach(() => {
    mocks.router.replace.mockClear()
  })

  it('redirects to workspace tags panel and preserves project query', async () => {
    const wrapper = mount(TagsPage)
    await flushPromises()

    expect(mocks.router.replace).toHaveBeenCalledWith({
      path: '/workspace',
      query: {
        project: 'project-1',
        panel: 'tags',
      },
    })
    expect(wrapper.get('[data-testid="legacy-tags-redirect"]').text()).toContain('Redirecting')
  })
})

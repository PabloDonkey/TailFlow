import { beforeEach, describe, expect, it, vi } from 'vitest'

const getOnboardingStatusMock = vi.fn(async () => ({ configured: true }))

vi.mock('../api', () => ({
  getOnboardingStatus: getOnboardingStatusMock,
}))

import router from '../router'

describe('router legacy-route convergence', () => {
  beforeEach(async () => {
    getOnboardingStatusMock.mockResolvedValue({ configured: true })
    await router.replace('/workspace')
  })

  it('redirects /gallery to workspace browser panel', async () => {
    await router.push('/gallery')

    expect(router.currentRoute.value.path).toBe('/workspace')
    expect(router.currentRoute.value.query.panel).toBe('browser')
  })

  it('redirects /tags to workspace tags panel', async () => {
    await router.push('/tags')

    expect(router.currentRoute.value.path).toBe('/workspace')
    expect(router.currentRoute.value.query.panel).toBe('tags')
  })

  it('redirects /image/:id with project query to workspace image context', async () => {
    await router.push({ path: '/image/image-42', query: { project: 'project-1' } })

    expect(router.currentRoute.value.path).toBe('/workspace')
    expect(router.currentRoute.value.query.image).toBe('image-42')
    expect(router.currentRoute.value.query.project).toBe('project-1')
  })

  it('keeps onboarding guard behavior after redirect mapping', async () => {
    getOnboardingStatusMock.mockResolvedValueOnce({ configured: false })

    await router.push('/gallery')

    expect(router.currentRoute.value.path).toBe('/onboarding')
  })
})

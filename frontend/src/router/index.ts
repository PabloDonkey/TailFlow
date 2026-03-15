import { createRouter, createWebHistory } from 'vue-router'
import { getOnboardingStatus } from '../api'
import UploadPage from '../pages/UploadPage.vue'
import OnboardingPage from '../pages/OnboardingPage.vue'
import WorkspacePage from '../pages/WorkspacePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/workspace' },
    { path: '/onboarding', component: OnboardingPage },
    { path: '/projects', component: UploadPage },
    { path: '/upload', redirect: '/projects' },
    { path: '/workspace', component: WorkspacePage },
    {
      path: '/gallery',
      redirect: {
        path: '/workspace',
        query: { panel: 'browser' },
      },
    },
    {
      path: '/image/:id',
      redirect: (to) => {
        const project = typeof to.query.project === 'string' ? to.query.project : undefined
        return {
          path: '/workspace',
          query: {
            ...(project ? { project } : {}),
            image: String(to.params.id),
          },
        }
      },
    },
    {
      path: '/tags',
      redirect: {
        path: '/workspace',
        query: { panel: 'tags' },
      },
    },
  ],
})

router.beforeEach(async (to) => {
  let status
  try {
    status = await getOnboardingStatus()
  } catch {
    return true
  }

  if (!status.configured && to.path !== '/onboarding') {
    return { path: '/onboarding' }
  }

  if (status.configured && to.path === '/onboarding') {
    return { path: '/workspace' }
  }

  return true
})

export default router

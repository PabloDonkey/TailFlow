import { createRouter, createWebHistory } from 'vue-router'
import { getOnboardingStatus } from '../api'
import OnboardingPage from '../pages/OnboardingPage.vue'
import WorkspacePage from '../pages/WorkspacePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/workspace' },
    { path: '/onboarding', component: OnboardingPage },
    { path: '/workspace', component: WorkspacePage },
    { path: '/:pathMatch(.*)*', redirect: '/workspace' },
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

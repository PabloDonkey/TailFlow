import { createRouter, createWebHistory } from 'vue-router'
import { getOnboardingStatus } from '../api'
import UploadPage from '../pages/UploadPage.vue'
import GalleryPage from '../pages/GalleryPage.vue'
import ImageDetailPage from '../pages/ImageDetailPage.vue'
import TagsPage from '../pages/TagsPage.vue'
import OnboardingPage from '../pages/OnboardingPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/onboarding', component: OnboardingPage },
    { path: '/projects', component: UploadPage },
    { path: '/upload', redirect: '/projects' },
    { path: '/gallery', component: GalleryPage },
    { path: '/image/:id', component: ImageDetailPage },
    { path: '/tags', component: TagsPage },
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
    return { path: '/projects' }
  }

  return true
})

export default router

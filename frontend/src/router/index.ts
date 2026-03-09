import { createRouter, createWebHistory } from 'vue-router'
import UploadPage from '../pages/UploadPage.vue'
import GalleryPage from '../pages/GalleryPage.vue'
import ImageDetailPage from '../pages/ImageDetailPage.vue'
import TagsPage from '../pages/TagsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', component: UploadPage },
    { path: '/upload', redirect: '/projects' },
    { path: '/gallery', component: GalleryPage },
    { path: '/image/:id', component: ImageDetailPage },
    { path: '/tags', component: TagsPage },
  ],
})

export default router

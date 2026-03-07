import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectImageRead, ProjectImageSummary } from '../api'
import * as api from '../api'

export const useImageStore = defineStore('images', () => {
  const images = ref<ProjectImageSummary[]>([])
  const currentImage = ref<ProjectImageRead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchImages(projectId: string) {
    loading.value = true
    error.value = null
    try {
      images.value = await api.listProjectImages(projectId)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchImage(projectId: string, id: string) {
    loading.value = true
    error.value = null
    try {
      currentImage.value = await api.getProjectImage(projectId, id)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function updateTags(projectId: string, id: string, add: string[], remove: string[]) {
    try {
      const updated = await api.updateProjectImageTags(projectId, id, add, remove)
      currentImage.value = updated
    } catch (e) {
      error.value = String(e)
    }
  }

  return { images, currentImage, loading, error, fetchImages, fetchImage, updateTags }
})

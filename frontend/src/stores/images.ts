import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ImageRead, ImageSummary, ImageUploadResponse } from '../api'
import * as api from '../api'

export const useImageStore = defineStore('images', () => {
  const images = ref<ImageSummary[]>([])
  const currentImage = ref<ImageRead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchImages() {
    loading.value = true
    error.value = null
    try {
      images.value = await api.listImages()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchImage(id: string) {
    loading.value = true
    error.value = null
    try {
      currentImage.value = await api.getImage(id)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function upload(file: File): Promise<ImageUploadResponse | null> {
    loading.value = true
    error.value = null
    try {
      const result = await api.uploadImage(file)
      await fetchImages()
      return result
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateTags(id: string, add: string[], remove: string[]) {
    try {
      const updated = await api.updateImageTags(id, add, remove)
      currentImage.value = updated
    } catch (e) {
      error.value = String(e)
    }
  }

  return { images, currentImage, loading, error, fetchImages, fetchImage, upload, updateTags }
})

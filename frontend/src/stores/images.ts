import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ProjectImageRead, ProjectImageSummary } from '../api'
import * as api from '../api'

export type ImageSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'tag-count-asc'
  | 'tag-count-desc'

function compareByName(a: ProjectImageSummary, b: ProjectImageSummary): number {
  return a.filename.localeCompare(b.filename, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export const useImageStore = defineStore('images', () => {
  const images = ref<ProjectImageSummary[]>([])
  const currentImage = ref<ProjectImageRead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sortOption = ref<ImageSortOption>('name-asc')

  const sortedImages = computed(() => {
    const sorted = [...images.value]
    sorted.sort((a, b) => {
      switch (sortOption.value) {
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
    })
    return sorted
  })

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

  async function updateTags(
    projectId: string,
    id: string,
    add: string[],
    remove: string[],
    createMissing = false,
  ) {
    loading.value = true
    error.value = null
    try {
      const updated = await api.updateProjectImageTags(
        projectId,
        id,
        add,
        remove,
        createMissing,
      )
      currentImage.value = updated
      const idx = images.value.findIndex((img) => img.id === id)
      const existing = idx !== -1 ? images.value[idx] : undefined
      if (existing !== undefined) {
        images.value[idx] = {
          ...existing,
          tag_count: updated.tag_count,
          filename: updated.filename,
          relative_path: updated.relative_path,
        }
      }
      return updated
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    images,
    sortedImages,
    currentImage,
    loading,
    error,
    sortOption,
    fetchImages,
    fetchImage,
    updateTags,
  }
})

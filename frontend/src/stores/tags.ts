import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Tag } from '../api'
import * as api from '../api'

export const useTagStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTags() {
    loading.value = true
    error.value = null
    try {
      tags.value = await api.listTags()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function addTag(name: string, category?: string): Promise<Tag | null> {
    loading.value = true
    error.value = null
    try {
      const tag = await api.createTag(name, category)
      tags.value.push(tag)
      tags.value.sort((a, b) => a.name.localeCompare(b.name))
      return tag
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return { tags, loading, error, fetchTags, addTag }
})

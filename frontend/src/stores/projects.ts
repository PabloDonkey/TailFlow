import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Project, ProjectDiscoverResponse, ProjectSyncResponse } from '../api'
import * as api from '../api'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const selectedProjectId = ref<string | null>(null)
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref<string | null>(null)
  const lastDiscover = ref<ProjectDiscoverResponse | null>(null)
  const lastSync = ref<ProjectSyncResponse | null>(null)

  const selectedProject = computed(() =>
    projects.value.find((project) => project.id === selectedProjectId.value) ?? null,
  )

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await api.listProjects()
      if (
        selectedProjectId.value !== null &&
        !projects.value.some((project) => project.id === selectedProjectId.value)
      ) {
        selectedProjectId.value = null
      }
      if (selectedProjectId.value === null && projects.value.length > 0) {
        const firstProject = projects.value[0]
        if (firstProject) {
          selectedProjectId.value = firstProject.id
        }
      }
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function discoverAndRefresh() {
    loading.value = true
    error.value = null
    try {
      lastDiscover.value = await api.discoverProjects()
      projects.value = await api.listProjects()
      if (selectedProjectId.value === null && projects.value.length > 0) {
        const firstProject = projects.value[0]
        if (firstProject) {
          selectedProjectId.value = firstProject.id
        }
      }
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function syncSelectedProject() {
    if (!selectedProjectId.value) {
      return null
    }

    syncing.value = true
    error.value = null
    try {
      lastSync.value = await api.syncProject(selectedProjectId.value)
      projects.value = await api.listProjects()
      return lastSync.value
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      syncing.value = false
    }
  }

  function selectProject(projectId: string) {
    selectedProjectId.value = projectId
  }

  return {
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    syncing,
    error,
    lastDiscover,
    lastSync,
    fetchProjects,
    discoverAndRefresh,
    syncSelectedProject,
    selectProject,
  }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Project,
  ProjectCreatePayload,
  ProjectCreateResponse,
  ProjectDiscoverResponse,
  ProjectImageUploadResponse,
  ProjectSyncResponse,
  ProjectUpdatePayload,
} from '../api'
import * as api from '../api'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const selectedProjectId = ref<string | null>(null)
  const loading = ref(false)
  const syncing = ref(false)
  const creating = ref(false)
  const updating = ref(false)
  const deleting = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const lastDiscover = ref<ProjectDiscoverResponse | null>(null)
  const lastSync = ref<ProjectSyncResponse | null>(null)
  const lastCreate = ref<ProjectCreateResponse | null>(null)
  const lastUpload = ref<ProjectImageUploadResponse | null>(null)

  const selectedProject = computed(() =>
    projects.value.find((project) => project.id === selectedProjectId.value) ?? null,
  )

  function applyProjectUpdate(updatedProject: Project) {
    projects.value = projects.value.map((project) =>
      project.id === updatedProject.id ? updatedProject : project,
    )
  }

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

  async function createProject(payload: ProjectCreatePayload) {
    creating.value = true
    error.value = null
    try {
      lastCreate.value = await api.createProject(payload)
      await fetchProjects()
      if (lastCreate.value?.project.id) {
        selectedProjectId.value = lastCreate.value.project.id
      }
      return lastCreate.value
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      creating.value = false
    }
  }

  async function uploadImagesToProject(projectId: string, files: File[]) {
    if (!projectId || files.length === 0) {
      return null
    }

    uploading.value = true
    error.value = null
    try {
      lastUpload.value = await api.uploadProjectImages(projectId, files)
      await fetchProjects()
      return lastUpload.value
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      uploading.value = false
    }
  }

  async function uploadImagesToSelectedProject(files: File[]) {
    if (!selectedProjectId.value) {
      return null
    }

    return uploadImagesToProject(selectedProjectId.value, files)
  }

  async function updateSelectedProjectMetadata(payload: ProjectUpdatePayload) {
    if (!selectedProjectId.value) {
      return null
    }

    updating.value = true
    error.value = null
    try {
      const updated = await api.updateProject(selectedProjectId.value, payload)
      applyProjectUpdate(updated)
      return updated
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      updating.value = false
    }
  }

  async function setFeaturedImage(projectId: string, imageId: string) {
    if (!projectId || !imageId) {
      return null
    }

    updating.value = true
    error.value = null
    try {
      const updated = await api.setProjectFeaturedImage(projectId, imageId)
      applyProjectUpdate(updated)
      return updated
    } catch (e) {
      error.value = String(e)
      return null
    } finally {
      updating.value = false
    }
  }

  async function deleteProject(projectId: string) {
    if (!projectId) {
      return false
    }

    deleting.value = true
    error.value = null
    try {
      await api.deleteProject(projectId)
      projects.value = projects.value.filter((project) => project.id !== projectId)
      if (selectedProjectId.value === projectId) {
        selectedProjectId.value = null
      }
      return true
    } catch (e) {
      error.value = String(e)
      return false
    } finally {
      deleting.value = false
    }
  }

  async function deleteSelectedProject() {
    if (!selectedProjectId.value) {
      return false
    }

    return deleteProject(selectedProjectId.value)
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
    creating,
    updating,
    deleting,
    uploading,
    error,
    lastDiscover,
    lastSync,
    lastCreate,
    lastUpload,
    fetchProjects,
    discoverAndRefresh,
    syncSelectedProject,
    createProject,
    uploadImagesToProject,
    uploadImagesToSelectedProject,
    updateSelectedProjectMetadata,
    setFeaturedImage,
    deleteProject,
    deleteSelectedProject,
    selectProject,
  }
})

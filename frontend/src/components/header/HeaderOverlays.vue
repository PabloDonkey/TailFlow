<script setup lang="ts">
import type { Project } from '../../api'
import ViewsMenu from './ViewsMenu.vue'
import ProjectPickerPanel from './ProjectPickerPanel.vue'

defineProps<{
  showProjectPicker: boolean
  showActionsMenu: boolean
  openViews: {
    imageBrowser: boolean
    imageInfo: boolean
    canvas: boolean
    currentTags: boolean
    aiProposedTags: boolean
    tagsLibrary: boolean
    projectDetails: boolean
  }
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  closeProjectPicker: []
  refreshProjects: []
  selectProject: [projectId: string]
  closeActionsMenu: []
  toggleView: [
    view:
      | 'image-browser'
      | 'image-info'
      | 'canvas'
      | 'current-tags'
      | 'ai-proposed-tags'
      | 'tags-library'
      | 'project-details',
  ]
}>()
</script>

<template>
  <ProjectPickerPanel
    v-if="showProjectPicker"
    :projects="projects"
    :selected-project-id="selectedProjectId"
    :loading="loading"
    :error="error"
    @close="emit('closeProjectPicker')"
    @refresh="emit('refreshProjects')"
    @select-project="(projectId) => emit('selectProject', projectId)"
  />

  <ViewsMenu
    v-if="showActionsMenu"
    :open-views="openViews"
    @close="emit('closeActionsMenu')"
    @toggle-view="(view) => emit('toggleView', view)"
  />
</template>
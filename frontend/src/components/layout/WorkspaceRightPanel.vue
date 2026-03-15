<script setup lang="ts">
import type { Project } from '../../api'
import UploadPage from '../../pages/UploadPage.vue'
import WorkspaceTagInspectorPanel from '../inspector/WorkspaceTagInspectorPanel.vue'
import WorkspaceTagsLibraryPanel from '../sidebar/WorkspaceTagsLibraryPanel.vue'

defineProps<{
  activePanel: 'inspector' | 'tags' | 'projects'
  projectId: string | null
  selectedProject: Project | null
}>()

const emit = defineEmits<{
  closeTagsLibrary: []
}>()
</script>

<template>
  <WorkspaceTagsLibraryPanel
    v-if="activePanel === 'tags'"
    :show-close="true"
    @close="emit('closeTagsLibrary')"
  />
  <UploadPage v-else-if="activePanel === 'projects'" />
  <WorkspaceTagInspectorPanel
    v-else
    :project-id="projectId"
    :selected-project="selectedProject"
  />
</template>
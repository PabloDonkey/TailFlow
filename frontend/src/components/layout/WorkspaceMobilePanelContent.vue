<script setup lang="ts">
import type { Project } from '../../api'
import UploadPage from '../../pages/UploadPage.vue'
import WorkspaceTagInspectorPanel from '../inspector/WorkspaceTagInspectorPanel.vue'
import WorkspaceImageBrowserPanel from '../sidebar/WorkspaceImageBrowserPanel.vue'
import WorkspaceTagsLibraryPanel from '../sidebar/WorkspaceTagsLibraryPanel.vue'

defineProps<{
  panel: 'browser' | 'inspector' | 'tags' | 'projects'
  selectedProjectId: string | null
  selectedProject: Project | null
}>()

const emit = defineEmits<{
  selectImage: [imageId: string]
}>()
</script>

<template>
  <WorkspaceImageBrowserPanel
    v-if="panel === 'browser'"
    :selected-project-id="selectedProjectId"
    @select-image="(imageId) => emit('selectImage', imageId)"
  />

  <WorkspaceTagInspectorPanel
    v-else-if="panel === 'inspector'"
    :project-id="selectedProjectId"
    :selected-project="selectedProject"
  />

  <WorkspaceTagsLibraryPanel
    v-else-if="panel === 'tags'"
    :show-close="false"
  />

  <UploadPage v-else />
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import WorkspaceImageBrowserPanel from '../components/sidebar/WorkspaceImageBrowserPanel.vue'

const imageStore = useImageStore()
const projectStore = useProjectStore()
const router = useRouter()

onMounted(async () => {
  if (!projectStore.projects.length) {
    await projectStore.fetchProjects()
  }
  if (projectStore.selectedProjectId) {
    await imageStore.fetchImages(projectStore.selectedProjectId)
  }
})

function goToImage(id: string) {
  if (!projectStore.selectedProjectId) {
    return
  }
  router.push({ path: `/image/${id}`, query: { project: projectStore.selectedProjectId } })
}

watch(
  () => projectStore.selectedProjectId,
  async (projectId) => {
    if (!projectId) {
      imageStore.images = []
      return
    }
    await imageStore.fetchImages(projectId)
  },
)
</script>

<template>
  <div class="gallery-page">
    <h1>Gallery</h1>
    <WorkspaceImageBrowserPanel
      :selected-project-id="projectStore.selectedProjectId"
      @select-image="goToImage"
    />
  </div>
</template>

<style scoped>
.gallery-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
}
</style>

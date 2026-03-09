<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import { getProjectImageFileUrl } from '../api'

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

    <p
      v-if="!projectStore.selectedProjectId"
      class="empty"
    >
      Select a project in <RouterLink to="/projects">
        Projects
      </RouterLink> first.
    </p>

    <p v-else-if="imageStore.loading">
      Loading…
    </p>
    <p
      v-else-if="imageStore.error"
      class="error"
    >
      {{ imageStore.error }}
    </p>
    <p
      v-else-if="!imageStore.images.length"
      class="empty"
    >
      No images yet. <RouterLink to="/projects">
        Select a project first.
      </RouterLink>
    </p>

    <div
      v-else
      class="grid"
    >
      <div
        v-for="img in imageStore.images"
        :key="img.id"
        class="card"
        @click="goToImage(img.id)"
      >
        <img
          :src="getProjectImageFileUrl(projectStore.selectedProjectId!, img.id)"
          :alt="img.filename"
          class="thumb"
          loading="lazy"
        >
        <div class="card-info">
          <span
            class="name"
            :title="img.filename"
          >{{ img.filename }}</span>
          <span class="tag-count">{{ img.relative_path }}</span>
        </div>
      </div>
    </div>
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

.error {
  color: #c00;
}

.empty a {
  color: #4a4e8a;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.card-info {
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  gap: 0.25rem;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tag-count {
  color: #666;
  white-space: nowrap;
}
</style>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import { getProjectImageFileUrl } from '../api'

const route = useRoute()
const imageStore = useImageStore()
const projectStore = useProjectStore()

const newTag = ref('')
const errorMsg = ref<string | null>(null)
const projectId = ref<string | null>(null)

onMounted(async () => {
  const projectFromQuery = route.query.project as string | undefined
  if (projectFromQuery) {
    projectId.value = projectFromQuery
  } else if (projectStore.selectedProjectId) {
    projectId.value = projectStore.selectedProjectId
  }

  if (!projectId.value) {
    errorMsg.value = 'Project context is required to view this image.'
    return
  }

  const id = route.params.id as string
  await imageStore.fetchImage(projectId.value, id)
})

async function addTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  const id = imageStore.currentImage?.id
  if (!id || !projectId.value) return
  errorMsg.value = null
  await imageStore.updateTags(projectId.value, id, [tag], [])
  if (imageStore.error) {
    errorMsg.value = imageStore.error
  } else {
    newTag.value = ''
  }
}

async function removeTag(tagName: string) {
  const id = imageStore.currentImage?.id
  if (!id || !projectId.value) return
  await imageStore.updateTags(projectId.value, id, [], [tagName])
}
</script>

<template>
  <div class="detail-page">
    <p v-if="imageStore.loading">
      Loading…
    </p>
    <p
      v-else-if="!imageStore.currentImage"
      class="error"
    >
      Image not found.
    </p>

    <template v-else>
      <div class="image-wrap">
        <img
          :src="getProjectImageFileUrl(projectId!, imageStore.currentImage.id)"
          :alt="imageStore.currentImage.filename"
          class="detail-img"
        >
      </div>

      <h2 class="image-name">
        {{ imageStore.currentImage.filename }}
      </h2>
      <p class="meta">
        Discovered {{ new Date(imageStore.currentImage.discovered_at).toLocaleString() }}
      </p>

      <div class="tags-section">
        <h3>Tags</h3>
        <div
          v-if="imageStore.currentImage.tags.length"
          class="tags-list"
        >
          <span
            v-for="tag in imageStore.currentImage.tags"
            :key="tag.id"
            class="tag"
          >
            {{ tag.name }}
            <button
              class="tag-remove"
              aria-label="Remove tag"
              @click="removeTag(tag.name)"
            >×</button>
          </span>
        </div>
        <p
          v-else
          class="no-tags"
        >
          No tags yet.
        </p>

        <div class="add-tag">
          <input
            v-model="newTag"
            placeholder="Add a tag…"
            class="tag-input"
            @keyup.enter="addTag"
          >
          <button
            class="btn btn-primary"
            @click="addTag"
          >
            Add
          </button>
        </div>
        <p
          v-if="errorMsg"
          class="error"
        >
          {{ errorMsg }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error {
  color: #c00;
}

.image-wrap {
  text-align: center;
}

.detail-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: contain;
}

.image-name {
  font-size: 1.1rem;
  font-weight: 600;
  word-break: break-all;
}

.meta {
  font-size: 0.85rem;
  color: #666;
}

.tags-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tags-section h3 {
  font-size: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: #e8eaf6;
  color: #3f51b5;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.no-tags {
  color: #888;
  font-size: 0.9rem;
}

.add-tag {
  display: flex;
  gap: 0.5rem;
}

.tag-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary {
  background: #4a4e8a;
  color: #fff;
}
</style>

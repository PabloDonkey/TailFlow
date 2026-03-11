<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import { getProjectImageFileUrl, type ProjectTag } from '../api'

const route = useRoute()
const imageStore = useImageStore()
const projectStore = useProjectStore()

const newTag = ref('')
const errorMsg = ref<string | null>(null)
const projectId = ref<string | null>(null)
const selectedProject = computed(() => projectStore.selectedProject)

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

  if (!projectStore.projects.length) {
    await projectStore.fetchProjects()
  }
  if (projectStore.selectedProjectId !== projectId.value) {
    projectStore.selectProject(projectId.value)
  }

  const id = route.params.id as string
  await imageStore.fetchImage(projectId.value, id)
})

function shouldConfirmTagCreation(error: string | null): boolean {
  return error?.includes('Confirm creation before adding it as a shared tag.') ?? false
}

function getTagRoleLabel(tag: ProjectTag): string | null {
  if (!tag.is_protected) {
    return null
  }
  if (tag.position === 0) {
    return 'Trigger'
  }
  if (tag.position === 1) {
    return 'Class'
  }
  return 'Protected'
}

function getTagSourceLabel(tag: ProjectTag): string {
  const catalogSources = Object.keys(tag.catalog_ids)
  if (!catalogSources.length) {
    return 'shared'
  }
  if (selectedProject.value && tag.catalog_ids[selectedProject.value.tagging_mode]) {
    return selectedProject.value.tagging_mode
  }
  return catalogSources.join(', ')
}

async function addTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  const id = imageStore.currentImage?.id
  if (!id || !projectId.value) return

  errorMsg.value = null

  let updated = await imageStore.updateTags(projectId.value, id, [tag], [])
  if (!updated && shouldConfirmTagCreation(imageStore.error)) {
    const confirmed = window.confirm(
      `Create "${tag}" as a shared user-defined tag for this project?`,
    )
    if (confirmed) {
      updated = await imageStore.updateTags(projectId.value, id, [tag], [], true)
    }
  }

  if (!updated && imageStore.error) {
    errorMsg.value = imageStore.error
  } else {
    newTag.value = ''
  }
}

async function removeTag(tag: ProjectTag) {
  if (tag.is_protected) {
    return
  }

  const id = imageStore.currentImage?.id
  if (!id || !projectId.value) return

  errorMsg.value = null
  const updated = await imageStore.updateTags(projectId.value, id, [], [tag.name])
  if (!updated && imageStore.error) {
    errorMsg.value = imageStore.error
  }
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
      <p
        v-if="selectedProject"
        class="meta"
      >
        Mode: <strong>{{ selectedProject.tagging_mode }}</strong>
      </p>

      <div class="tags-section">
        <h3>Tags</h3>
        <p class="tags-help">
          Trigger and class tags are protected here. Unknown tags require confirmation before creation.
        </p>
        <div
          v-if="imageStore.currentImage.tags.length"
          class="tags-list"
        >
          <span
            v-for="tag in imageStore.currentImage.tags"
            :key="tag.id"
            class="tag"
            :class="{ protected: tag.is_protected }"
          >
            <span class="tag-name">{{ tag.name }}</span>
            <span
              v-if="getTagRoleLabel(tag)"
              class="tag-badge tag-role"
            >{{ getTagRoleLabel(tag) }}</span>
            <span class="tag-badge tag-source">{{ getTagSourceLabel(tag) }}</span>
            <button
              class="tag-remove"
              aria-label="Remove tag"
              :disabled="tag.is_protected"
              :title="tag.is_protected ? 'Protected tags can only be edited from project metadata.' : 'Remove tag'"
              @click="removeTag(tag)"
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
            data-testid="add-tag-input"
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
  gap: 0.35rem;
  background: #e8eaf6;
  color: #3f51b5;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.tag.protected {
  background: #eef5ff;
  color: #214d8a;
}

.tag-name {
  font-weight: 600;
}

.tag-badge {
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.72rem;
  line-height: 1.4;
}

.tag-role {
  background: rgba(33, 77, 138, 0.12);
}

.tag-source {
  background: rgba(63, 81, 181, 0.12);
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

.tag-remove:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.no-tags {
  color: #888;
  font-size: 0.9rem;
}

.tags-help {
  color: #666;
  font-size: 0.88rem;
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

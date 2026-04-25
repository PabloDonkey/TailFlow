<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Project, ProjectTag } from '../../api'
import { useTagMutations } from '../../composables/useTagMutations'
import { useImageStore } from '../../stores/images'
import { useTagStore } from '../../stores/tags'
import { getCatalogIdByTaggingMode } from '../../utils/tagCatalog'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import TagInspectorMutationControls from './TagInspectorMutationControls.vue'
import TagInspectorTagList from './TagInspectorTagList.vue'

const props = defineProps<{
  projectId: string | null
  selectedProject: Project | null
}>()

const imageStore = useImageStore()
const tagStore = useTagStore()
const currentImage = computed(() => imageStore.currentImage)
const projectIdRef = computed(() => props.projectId)
const selectedTagNames = computed(() => currentImage.value?.tags.map((tag) => tag.name) ?? [])

onMounted(async () => {
  if (!tagStore.tags.length) {
    await tagStore.fetchTags()
  }
})

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

function getTagSourceLabel(tag: ProjectTag): string | null {
  const catalogSources = Object.keys(tag.catalog_ids)
  if (!catalogSources.length) {
    return null
  }
  if (
    props.selectedProject &&
    props.selectedProject.tagging_mode &&
    getCatalogIdByTaggingMode(tag, props.selectedProject.tagging_mode)
  ) {
    return props.selectedProject.tagging_mode
  }
  return catalogSources.join(', ')
}

const {
  mutationError,
  mutationLoading,
  addTag,
  removeTag
} = useTagMutations({
  imageStore,
  projectId: projectIdRef,
  currentImage
})

async function fetchTagSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return []
  }

  if (!tagStore.tags.length && !tagStore.loading) {
    await tagStore.fetchTags()
  }

  const storeNames = tagStore.tags.map((tag) => tag.name)
  const currentImageNames = currentImage.value?.tags.map((tag) => tag.name) ?? []
  const mergedCandidates = [...storeNames, ...currentImageNames]

  return mergedCandidates.filter((name) => name.toLowerCase().includes(trimmed))
}

async function handleAddTag(tagName: string) {
  if (mutationLoading.value) {
    return
  }
  await addTag(tagName)
}

function formatTagCount(tagCount: number): string {
  return `${tagCount} tag${tagCount === 1 ? '' : 's'}`
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <AppSectionTitle>Tag Inspector</AppSectionTitle>

    <AppText v-if="!currentImage">
      Select an image to inspect tags.
    </AppText>

    <template v-else>
      <AppText
        v-if="selectedProject"
        tone="muted"
      >
        Mode: <strong>{{ selectedProject.tagging_mode }}</strong>
      </AppText>

      <AppText tone="muted">
        Image tags: {{ formatTagCount(currentImage.tag_count) }}
      </AppText>

      <AppText tone="muted">
        Trigger and class tags are protected here. Unknown tags require confirmation before creation.
      </AppText>

      <TagInspectorTagList
        :tags="currentImage.tags"
        :get-tag-role-label="getTagRoleLabel"
        :get-tag-source-label="getTagSourceLabel"
        @remove="removeTag"
      />

      <TagInspectorMutationControls
        :error-msg="mutationError"
        :selected-tags="selectedTagNames"
        :fetch-suggestions="fetchTagSuggestions"
        :disabled="mutationLoading"
        @add="handleAddTag"
      />
    </template>
  </section>
</template>

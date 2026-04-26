<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Project, ProjectTag, TaggingMode } from '../../api'
import { useTagMutations } from '../../composables/useTagMutations'
import { useImageStore } from '../../stores/images'
import { useTagStore } from '../../stores/tags'
import { getCatalogIdByTaggingMode } from '../../utils/tagCatalog'
import AppText from '../ui/AppText.vue'
import TagInspectorAiProposedTagsPanel from './TagInspectorAiProposedTagsPanel.vue'
import TagInspectorMutationControls from './TagInspectorMutationControls.vue'
import TagInspectorTagList from './TagInspectorTagList.vue'

let inspectorRegionCounter = 0

const props = defineProps<{
  projectId: string | null
  selectedProject: Project | null
}>()

const imageStore = useImageStore()
const tagStore = useTagStore()
const currentImage = computed(() => imageStore.currentImage)
const projectIdRef = computed(() => props.projectId)
const selectedTagNames = computed(() => currentImage.value?.tags.map((tag) => tag.name) ?? [])
const inspectorMode = ref<TaggingMode>('booru')
const inspectorRegionId = `tag-inspector-region-${++inspectorRegionCounter}`
const currentTagsHeadingId = `current-tags-heading-${inspectorRegionId}`

watch(
  () => props.selectedProject?.tagging_mode,
  (taggingMode) => {
    if (taggingMode) {
      inspectorMode.value = taggingMode
    }
  },
  { immediate: true },
)

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
  <section
    class="flex h-full min-h-0 flex-col gap-3"
    role="region"
    aria-label="Tag inspector panels"
  >

    <AppText v-if="!currentImage">
      Select an image to inspect tags.
    </AppText>

    <template v-else>
      <section
        class="flex min-h-0 h-[calc(50vh-1rem)] flex-col rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3"
        role="region"
        :aria-labelledby="currentTagsHeadingId"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3
            :id="currentTagsHeadingId"
            class="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tf-color-text-default)]"
          >
            Current Tags
          </h3>
          <AppText tone="muted">
            {{ formatTagCount(currentImage.tag_count) }}
          </AppText>
        </div>

        <div class="mt-3">
          <TagInspectorMutationControls
            :error-msg="mutationError"
            :selected-tags="selectedTagNames"
            :fetch-suggestions="fetchTagSuggestions"
            :tag-source="inspectorMode"
            :disabled="mutationLoading"
            @add="handleAddTag"
            @update:tag-source="(value) => inspectorMode = value"
          />
        </div>

        <TagInspectorTagList
          class="mt-3"
          :tags="currentImage.tags"
          :get-tag-role-label="getTagRoleLabel"
          :get-tag-source-label="getTagSourceLabel"
          @remove="removeTag"
        />
      </section>

      <TagInspectorAiProposedTagsPanel
        class="h-[calc(50vh-1rem)]"
        :image-id="currentImage.id"
        :mode="inspectorMode"
        :current-tags="currentImage.tags"
        :disabled="mutationLoading"
        :get-tag-role-label="getTagRoleLabel"
        @add="handleAddTag"
      />
    </template>
  </section>
</template>

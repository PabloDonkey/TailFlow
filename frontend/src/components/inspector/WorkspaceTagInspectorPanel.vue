<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project, ProjectTag } from '../../api'
import { useTagMutations } from '../../composables/useTagMutations'
import { useImageStore } from '../../stores/images'
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
const newTag = ref('')
const currentImage = computed(() => imageStore.currentImage)
const projectIdRef = computed(() => props.projectId)

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

async function handleAddTag() {
  if (mutationLoading.value) {
    return
  }
  const added = await addTag(newTag.value)
  if (added) {
    newTag.value = ''
  }
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <AppSectionTitle v-if="currentImage">
      Tags ({{ currentImage.tag_count }})
    </AppSectionTitle>
    <AppSectionTitle v-else>
      Tag Inspector
    </AppSectionTitle>

    <AppText v-if="!currentImage">
      Select an image to inspect tags.
    </AppText>

    <template v-else>
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
        v-model="newTag"
        :error-msg="mutationError"
        @add="handleAddTag"
      />
    </template>
  </section>
</template>

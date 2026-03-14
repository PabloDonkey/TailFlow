<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project } from '../../api'
import { useImageStore } from '../../stores/images'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import TagInspectorMutationControls from './TagInspectorMutationControls.vue'
import TagInspectorTagList from './TagInspectorTagList.vue'
import { useTagMutation } from './taginspector/useTagMutation'

const props = defineProps<{
  projectId: string | null
  selectedProject: Project | null
}>()

const imageStore = useImageStore()
const newTag = ref('')
const errorMsg = ref<string | null>(null)
const currentImage = computed(() => imageStore.currentImage)

const {
  getTagRoleLabel,
  getTagSourceLabel,
  addTag,
  removeTag
} = useTagMutation({
  imageStore,
  projectId: props.projectId,
  selectedProject: props.selectedProject,
  currentImage,
  newTag,
  errorMsg
})
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
        :error-msg="errorMsg"
        @add="addTag"
      />
    </template>
  </section>
</template>

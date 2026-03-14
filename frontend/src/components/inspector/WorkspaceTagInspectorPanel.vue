<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project } from '../../api'
import { useImageStore } from '../../stores/images'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import TagList from './taginspector/TagList.vue'
import TagAddInput from './taginspector/TagAddInput.vue'
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


      <TagList
        :tags="currentImage.tags"
        :get-tag-role-label="getTagRoleLabel"
        :get-tag-source-label="getTagSourceLabel"
        :on-remove="removeTag"
      >
        <template #empty>
          <AppText tone="muted">
            No tags yet.
          </AppText>
        </template>
      </TagList>

      <TagAddInput
        v-model="newTag"
        @add="addTag"
      />

      <AppErrorText v-if="errorMsg">
        {{ errorMsg }}
      </AppErrorText>
    </template>
  </section>
</template>

<style scoped>
.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--tf-color-text-muted);
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.tag-remove:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>

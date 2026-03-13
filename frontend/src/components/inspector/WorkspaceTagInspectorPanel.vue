<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project, ProjectTag } from '../../api'
import { useImageStore } from '../../stores/images'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'

const props = defineProps<{
  projectId: string | null
  selectedProject: Project | null
}>()

const imageStore = useImageStore()
const newTag = ref('')
const errorMsg = ref<string | null>(null)
const currentImage = computed(() => imageStore.currentImage)

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

function getTagSourceLabel(tag: ProjectTag): string | null {
  const catalogSources = Object.keys(tag.catalog_ids)
  if (!catalogSources.length) {
    return null
  }
  if (props.selectedProject && tag.catalog_ids[props.selectedProject.tagging_mode]) {
    return props.selectedProject.tagging_mode
  }
  return catalogSources.join(', ')
}

async function addTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  const imageId = currentImage.value?.id
  if (!imageId || !props.projectId) return

  errorMsg.value = null

  let updated = await imageStore.updateTags(props.projectId, imageId, [tag], [])
  if (!updated && shouldConfirmTagCreation(imageStore.error)) {
    const confirmed = window.confirm(
      `Create "${tag}" as a shared user-defined tag for this project?`,
    )
    if (confirmed) {
      updated = await imageStore.updateTags(props.projectId, imageId, [tag], [], true)
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

  const imageId = currentImage.value?.id
  if (!imageId || !props.projectId) return

  errorMsg.value = null
  const updated = await imageStore.updateTags(props.projectId, imageId, [], [tag.name])
  if (!updated && imageStore.error) {
    errorMsg.value = imageStore.error
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

      <div
        v-if="currentImage.tags.length"
        class="flex flex-wrap gap-1.5"
      >
        <span
          v-for="tag in currentImage.tags"
          :key="tag.id"
          class="tag inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.8rem]"
          :class="tag.is_protected
            ? 'border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-[var(--tf-color-text-default)]'
            : 'border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-[var(--tf-color-text-muted)]'"
        >
          <span class="tag-name font-semibold">{{ tag.name }}</span>
          <span
            v-if="getTagRoleLabel(tag)"
            class="tag-badge rounded-full border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-1.5 py-0.5 text-[0.7rem]"
          >{{ getTagRoleLabel(tag) }}</span>
          <span
            v-if="getTagSourceLabel(tag)"
            class="tag-badge rounded-full border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-1.5 py-0.5 text-[0.7rem]"
          >{{ getTagSourceLabel(tag) }}</span>
          <button
            class="tag-remove"
            aria-label="Remove tag"
            :disabled="tag.is_protected"
            :title="tag.is_protected ? 'Protected tags can only be edited from project metadata.' : 'Remove tag'"
            @click="removeTag(tag)"
          >×</button>
        </span>
      </div>
      <AppText
        v-else
        tone="muted"
      >
        No tags yet.
      </AppText>

      <div class="add-tag flex gap-2">
        <input
          v-model="newTag"
          data-testid="add-tag-input"
          placeholder="Add a tag…"
          class="tag-input min-w-0 flex-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
          @keyup.enter="addTag"
        >
        <button
          class="btn btn-primary rounded-[var(--tf-radius-md)] border-0 bg-[var(--tf-color-header-action-bg)] px-3 py-2 text-[var(--tf-color-header-text)]"
          @click="addTag"
        >
          Add
        </button>
      </div>

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

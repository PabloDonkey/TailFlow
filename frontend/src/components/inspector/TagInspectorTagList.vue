<script setup lang="ts">
import type { ProjectTag } from '../../api'
import AppText from '../ui/AppText.vue'
import TagInspectorTagMetadata from './TagInspectorTagMetadata.vue'

const props = defineProps<{
  tags: ProjectTag[]
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
}>()

const emit = defineEmits<{
  remove: [tag: ProjectTag]
}>()
</script>

<template>
  <div
    v-if="props.tags.length"
    class="flex flex-wrap gap-1.5"
  >
    <span
      v-for="tag in props.tags"
      :key="tag.id"
      class="tag inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.8rem]"
      :class="tag.is_protected
        ? 'border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-[var(--tf-color-text-default)]'
        : 'border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-[var(--tf-color-text-muted)]'"
    >
      <span class="tag-name font-semibold">{{ tag.name }}</span>
      <TagInspectorTagMetadata
        :role-label="props.getTagRoleLabel(tag)"
        :source-label="props.getTagSourceLabel(tag)"
      />
      <button
        class="tag-remove"
        aria-label="Remove tag"
        :disabled="tag.is_protected"
        :title="tag.is_protected ? 'Protected tags can only be edited from project metadata.' : 'Remove tag'"
        @click="emit('remove', tag)"
      >×</button>
    </span>
  </div>

  <AppText
    v-else
    tone="muted"
  >
    No tags yet.
  </AppText>
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

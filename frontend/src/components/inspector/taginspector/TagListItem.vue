<script setup lang="ts">
import type { ProjectTag } from '../../../api'

defineProps<{
  tag: ProjectTag
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
  onRemove: (tag: ProjectTag) => void
}>()
</script>

<template>
  <span
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
      @click="onRemove(tag)"
    >×</button>
  </span>
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

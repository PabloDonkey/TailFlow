defineProps<{
<script setup lang="ts">
import type { ProjectTag } from '../../../api'
import TagListItem from './TagListItem.vue'

defineProps<{
  tags: ProjectTag[]
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
  onRemove: (tag: ProjectTag) => void
}>()
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1.5">
    <TagListItem
      v-for="tag in tags"
      :key="tag.id"
      :tag="tag"
      :getTagRoleLabel="getTagRoleLabel"
      :getTagSourceLabel="getTagSourceLabel"
      :onRemove="onRemove"
    />
  </div>
  <div v-else>
    <slot name="empty">No tags yet.</slot>
  </div>
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

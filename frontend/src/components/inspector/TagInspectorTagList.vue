<script setup lang="ts">
import type { ProjectTag } from '../../api'
import AppText from '../ui/AppText.vue'
import TagInspectorTagRow from './TagInspectorTagRow.vue'

const props = defineProps<{
  tags: ProjectTag[]
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
}>()

const emit = defineEmits<{
  remove: [tag: ProjectTag]
}>()

function buildTagMeta(tag: ProjectTag): string {
  const parts: string[] = []
  const roleLabel = props.getTagRoleLabel(tag)
  const sourceLabel = props.getTagSourceLabel(tag)

  if (roleLabel) {
    parts.push(roleLabel)
  }

  if (sourceLabel) {
    parts.push(sourceLabel)
  }

  return parts.join(' • ')
}
</script>

<template>
  <ul
    v-if="props.tags.length"
    class="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto pr-1"
  >
    <TagInspectorTagRow
      v-for="tag in props.tags"
      :key="tag.id"
      :label="tag.name"
      :meta="buildTagMeta(tag)"
      :variant="tag.is_protected ? 'selected' : 'default'"
      :action-label="tag.is_protected ? 'Protected' : 'Remove'"
      :action-kind="tag.is_protected ? null : 'remove'"
      :action-disabled="tag.is_protected"
      @action="emit('remove', tag)"
    />
  </ul>

  <AppText
    v-else
    tone="muted"
  >
    No tags yet.
  </AppText>
</template>

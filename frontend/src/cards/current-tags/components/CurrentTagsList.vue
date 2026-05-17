<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectTag } from '../../../api'
import { useTagListFilter } from '../../../composables/useTagListFilter'
import AppText from '../../../components/ui/AppText.vue'
import CurrentTagsCopyButton from './CurrentTagsCopyButton.vue'
import TagActionRow from '../../shared/TagActionRow.vue'
import TagListFilterInput from '../../shared/TagListFilterInput.vue'

const props = defineProps<{
  tags: ProjectTag[]
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
}>()

const emit = defineEmits<{
  remove: [tag: ProjectTag]
}>()

const {
  filterQuery,
  filteredItems: filteredTags,
} = useTagListFilter(computed(() => props.tags), (tag) => tag.name)

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
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <TagListFilterInput
        v-model="filterQuery"
        placeholder="Filter current tags"
        aria-label="Filter current tags"
      />

      <CurrentTagsCopyButton :tags="props.tags" />
    </div>

    <ul
      v-if="filteredTags.length"
      class="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto pr-1"
    >
      <TagActionRow
        v-for="tag in filteredTags"
        :key="tag.id"
        :label="tag.name"
        :meta="buildTagMeta(tag)"
        :variant="tag.is_protected ? 'selected' : 'default'"
        :action-label="tag.is_protected ? 'Protected' : 'Remove'"
        :action-aria-label="tag.is_protected ? null : `Remove tag ${tag.name}`"
        :action-kind="tag.is_protected ? null : 'remove'"
        :action-disabled="tag.is_protected"
        @action="emit('remove', tag)"
      />
    </ul>

    <AppText
      v-else
      tone="muted"
    >
      {{ props.tags.length ? 'No tags match the current filter.' : 'No tags yet.' }}
    </AppText>
  </div>
</template>

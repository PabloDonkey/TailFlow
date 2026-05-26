<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectTag } from '../../../api'
import { useTagListFilter } from '../../../composables/useTagListFilter'
import AppText from '../../../components/ui/AppText.vue'
import CurrentTagsCopyButton from './CurrentTagsCopyButton.vue'
import TagsTextareaField from '../../shared/TagsTextareaField.vue'
import TagListFilterInput from '../../shared/TagListFilterInput.vue'

const props = defineProps<{
  tags: ProjectTag[]
  getTagRoleLabel: (tag: ProjectTag) => string | null
  getTagSourceLabel: (tag: ProjectTag) => string | null
  showFilter?: boolean
  showTags?: boolean
  showCopyButton?: boolean
}>()

const emit = defineEmits<{
  remove: [tag: ProjectTag]
}>()

const {
  filterQuery,
  filteredItems: filteredTags,
} = useTagListFilter(computed(() => props.tags), (tag) => tag.name)

const tagById = computed(() => {
  const map = new Map<string, ProjectTag>()
  for (const tag of props.tags) {
    map.set(tag.id, tag)
  }
  return map
})

const displayTags = computed(() =>
  filteredTags.value.map((tag) => ({
    key: tag.id,
    label: tag.name,
    meta: buildTagMeta(tag) || null,
    variant: 'selected' as const,
    actionIcon: tag.is_protected ? 'lock' : 'x',
    actionAriaLabel: tag.is_protected ? null : `Remove tag ${tag.name}`,
    actionDisabled: tag.is_protected,
  })),
)

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

function handleTagAction(tagId: string): void {
  const tag = tagById.value.get(tagId)
  if (!tag || tag.is_protected) {
    return
  }
  emit('remove', tag)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    <div
      class="grid items-center gap-2"
      :class="props.showTags === false ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_auto]'"
    >
      <TagListFilterInput
        v-if="props.showFilter !== false"
        v-model="filterQuery"
        placeholder="Filter current tags"
        aria-label="Filter current tags"
      />

      <CurrentTagsCopyButton
        v-if="props.showTags !== false && props.showCopyButton !== false"
        :tags="props.tags"
      />
    </div>

    <div
      v-if="props.showTags !== false"
      class="min-h-0 flex-1"
    >
      <TagsTextareaField
        v-if="displayTags.length"
        :items="displayTags"
        placeholder="Current tags..."
        @action="handleTagAction"
      />

      <AppText
        v-else
        tone="muted"
      >
        {{ props.tags.length ? 'No tags match the current filter.' : 'No tags yet.' }}
      </AppText>
    </div>
  </div>
</template>

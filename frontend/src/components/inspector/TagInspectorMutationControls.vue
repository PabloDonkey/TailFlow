<script setup lang="ts">
import { ref } from 'vue'
import type { TaggingMode } from '../../api'
import AppSegmentedToggle from '../../design-system/AppSegmentedToggle.vue'
import TagAutocompleteInput from '../../design-system/TagAutocompleteInput.vue'
import AppToolbar from '../../design-system/AppToolbar.vue'
import AppErrorText from '../ui/AppErrorText.vue'

const tagSourceOptions = [
  { label: 'e621', value: 'e621' },
  { label: 'booru', value: 'booru' },
]

withDefaults(defineProps<{
  errorMsg: string | null
  selectedTags: string[]
  fetchSuggestions: (query: string) => Promise<string[]>
  tagSource?: TaggingMode
  disabled?: boolean
}>(), {
  tagSource: 'booru',
})

const emit = defineEmits<{
  add: [tag: string]
  'update:tagSource': [value: TaggingMode]
}>()
const autocompleteRef = ref<InstanceType<typeof TagAutocompleteInput> | null>(null)

function triggerSelection() {
  autocompleteRef.value?.selectActiveOrCurrent()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <AppToolbar
      aria-label="Tag mutation toolbar"
      class="flex flex-wrap items-center gap-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-alt)] p-2"
    >
      <TagAutocompleteInput
        ref="autocompleteRef"
        class="min-w-[12rem] flex-1"
        :selected-tags="selectedTags"
        :fetch-suggestions="fetchSuggestions"
        :disabled="disabled"
        @select="(tag) => emit('add', tag)"
      />

      <div class="hidden h-7 w-px bg-[var(--tf-color-surface-border)] sm:block" />

      <AppSegmentedToggle
        :model-value="tagSource ?? 'booru'"
        :options="tagSourceOptions"
        aria-label="Tag source"
        :disabled="disabled"
        @update:model-value="(value) => emit('update:tagSource', value as TaggingMode)"
      />

      <button
        type="button"
        class="rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2.5 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click="triggerSelection"
      >
        Add
      </button>
    </AppToolbar>

    <AppErrorText v-if="errorMsg">
      {{ errorMsg }}
    </AppErrorText>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TaggingMode } from '../../../api'
import AppSelectField from '../../../design-system/AppSelectField.vue'
import TagAutocompleteInput from '../../../design-system/TagAutocompleteInput.vue'
import AppToolbar from '../../../design-system/AppToolbar.vue'
import AppErrorText from '../../../components/ui/AppErrorText.vue'

const tagSourceOptions = [
  { label: 'e621', value: 'e621' },
  { label: 'booru', value: 'booru' },
]

withDefaults(defineProps<{
  errorMsg: string | null
  selectedTags: string[]
  fetchSuggestions: (query: string) => Promise<string[]>
  tagCount: number
  tagSource?: TaggingMode
  disabled?: boolean
  showSearch?: boolean
  searchOnly?: boolean
}>(), {
  tagSource: 'booru',
  showSearch: true,
  searchOnly: false,
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
  <div class="flex w-full flex-col gap-1.5">
    <AppToolbar
      aria-label="Tag mutation toolbar"
      class="inline-grid gap-2"
      :class="searchOnly ? 'grid-cols-1' : 'grid-cols-3'"
    >
      <div
        class="relative min-w-0 self-stretch"
        :class="searchOnly ? 'col-span-1' : 'col-span-2'"
      >
        <TagAutocompleteInput
          v-if="showSearch"
          ref="autocompleteRef"
          class="h-full w-full [&_.tag-input]:h-full"
          :class="searchOnly ? '' : '[&_.tag-input]:pr-28'"
          :selected-tags="selectedTags"
          :fetch-suggestions="fetchSuggestions"
          placeholder="Search tags"
          :disabled="disabled"
          @select="(tag) => emit('add', tag)"
        />

        <div
          v-if="!searchOnly"
          class="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5"
        >
          <span class="whitespace-nowrap text-xs text-[var(--tf-color-text-muted)]">
            {{ tagCount }} tags
          </span>
          <button
            type="button"
            class="rounded-[8px] bg-[rgb(101_186_116)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="disabled"
            @click="triggerSelection"
          >
            +
          </button>
        </div>
      </div>

      <AppSelectField
        v-if="!searchOnly"
        class="min-w-[7rem]"
        :model-value="tagSource ?? 'booru'"
        :options="tagSourceOptions"
        aria-label="Tag type"
        placeholder="Tag type"
        :disabled="disabled"
        @update:model-value="(value) => emit('update:tagSource', value as TaggingMode)"
      />
    </AppToolbar>

    <AppErrorText v-if="errorMsg">
      {{ errorMsg }}
    </AppErrorText>
  </div>
</template>

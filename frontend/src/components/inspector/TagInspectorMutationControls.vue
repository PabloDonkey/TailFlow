<script setup lang="ts">
import { ref } from 'vue'
import TagAutocompleteInput from '../../design-system/TagAutocompleteInput.vue'
import AppErrorText from '../ui/AppErrorText.vue'

defineProps<{
  errorMsg: string | null
  selectedTags: string[]
  fetchSuggestions: (query: string) => Promise<string[]>
  disabled?: boolean
}>()

const emit = defineEmits<{ add: [tag: string] }>()
const autocompleteRef = ref<InstanceType<typeof TagAutocompleteInput> | null>(null)

function triggerSelection() {
  autocompleteRef.value?.selectActiveOrCurrent()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="add-tag flex gap-2">
      <TagAutocompleteInput
        ref="autocompleteRef"
        class="min-w-0 flex-1"
        :selected-tags="selectedTags"
        :fetch-suggestions="fetchSuggestions"
        :disabled="disabled"
        @select="(tag) => emit('add', tag)"
      />
      <button
        class="btn btn-primary rounded-[var(--tf-radius-md)] border-0 bg-[var(--tf-color-header-action-bg)] px-3 py-2 text-[var(--tf-color-header-text)]"
        :disabled="disabled"
        @click="triggerSelection"
      >
        Add
      </button>
    </div>

    <AppErrorText v-if="errorMsg">
      {{ errorMsg }}
    </AppErrorText>
  </div>
</template>

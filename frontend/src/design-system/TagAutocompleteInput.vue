<script setup lang="ts">
import {
  AutocompleteAnchor,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompletePortal,
  AutocompleteRoot,
  AutocompleteViewport,
} from 'reka-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type FetchSuggestions = (query: string) => Promise<string[]>

const props = withDefaults(defineProps<{
  selectedTags: string[]
  fetchSuggestions: FetchSuggestions
  maxSuggestions?: number
  placeholder?: string
  disabled?: boolean
  debounceMs?: number
}>(), {
  maxSuggestions: 10,
  placeholder: 'Add a tag…',
  disabled: false,
  debounceMs: 120,
})

const emit = defineEmits<{
  select: [tag: string]
}>()

const query = ref('')
const open = ref(false)
const loading = ref(false)
const highlightedValue = ref<string | null>(null)
const fetchedSuggestions = ref<string[]>([])
const requestId = ref(0)

const normalizedSelected = computed(() =>
  new Set(props.selectedTags.map((tag) => tag.trim().toLowerCase())),
)

const visibleSuggestions = computed(() => {
  const deduped = new Set<string>()
  const result: string[] = []

  for (const suggestion of fetchedSuggestions.value) {
    const trimmed = suggestion.trim()
    if (!trimmed) {
      continue
    }
    const normalized = trimmed.toLowerCase()
    if (normalizedSelected.value.has(normalized) || deduped.has(normalized)) {
      continue
    }
    deduped.add(normalized)
    result.push(trimmed)

    if (result.length >= props.maxSuggestions) {
      break
    }
  }

  return result
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(query, (value) => {
  highlightedValue.value = null
  fetchedSuggestions.value = []

  const trimmed = value.trim()
  if (!trimmed) {
    loading.value = false
    open.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    return
  }

  open.value = true

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    const currentRequestId = requestId.value + 1
    requestId.value = currentRequestId
    loading.value = true

    try {
      const suggestions = await props.fetchSuggestions(trimmed)
      if (requestId.value !== currentRequestId) {
        return
      }
      fetchedSuggestions.value = suggestions
    } finally {
      if (requestId.value === currentRequestId) {
        loading.value = false
      }
    }
  }, props.debounceMs)
})

function selectValue(value: string): void {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }

  if (normalizedSelected.value.has(trimmed.toLowerCase())) {
    query.value = ''
    open.value = false
    highlightedValue.value = null
    return
  }

  emit('select', trimmed)
  query.value = ''
  open.value = false
  highlightedValue.value = null
}

function selectActiveOrCurrent(): void {
  if (highlightedValue.value) {
    selectValue(highlightedValue.value)
    return
  }
  selectValue(query.value)
}

function handleEnter(event: KeyboardEvent): void {
  event.preventDefault()
  selectActiveOrCurrent()
}

function handleEscape(): void {
  open.value = false
  highlightedValue.value = null
}

function handleHighlight(payload: { ref: HTMLElement; value: string } | undefined): void {
  highlightedValue.value = payload?.value ?? null
}

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

defineExpose({
  selectActiveOrCurrent,
})
</script>

<template>
  <AutocompleteRoot
    v-model="query"
    v-model:open="open"
    :ignore-filter="true"
    :disabled="disabled"
    :open-on-focus="false"
    class="w-full"
    @highlight="handleHighlight"
  >
    <AutocompleteAnchor class="w-full">
      <AutocompleteInput
        aria-label="Add tag"
        data-testid="add-tag-input"
        class="tag-input w-full rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
        :placeholder="placeholder"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
      />
    </AutocompleteAnchor>

    <AutocompletePortal>
      <AutocompleteContent
        position="popper"
        side="bottom"
        :side-offset="4"
        class="z-[130] max-h-56 min-w-[14rem] overflow-auto rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1 shadow-lg"
      >
        <AutocompleteViewport>
          <div
            v-if="loading"
            class="px-2 py-1.5 text-sm text-[var(--tf-color-text-muted)]"
          >
            Loading...
          </div>

          <template v-else>
            <AutocompleteItem
              v-for="suggestion in visibleSuggestions"
              :key="suggestion"
              :value="suggestion"
              class="cursor-pointer rounded-[var(--tf-radius-sm)] px-2 py-1.5 text-sm text-[var(--tf-color-text-default)] data-[highlighted]:bg-[var(--tf-color-surface-border)]"
              @select="() => selectValue(suggestion)"
            >
              {{ suggestion }}
            </AutocompleteItem>

            <AutocompleteEmpty class="px-2 py-1.5 text-sm text-[var(--tf-color-text-muted)]">
              No results
            </AutocompleteEmpty>
          </template>
        </AutocompleteViewport>
      </AutocompleteContent>
    </AutocompletePortal>
  </AutocompleteRoot>
</template>
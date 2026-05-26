<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProjectTag } from '../../../api'
import { useToast } from '../../../composables/useToast'

const props = defineProps<{
  tags: ProjectTag[]
}>()

const copied = ref(false)
const { showToast } = useToast()

const copyPayload = computed(() =>
  props.tags.map((tag) => tag.name.trim()).filter((name) => name.length > 0).join(','),
)

async function copyTags(): Promise<void> {
  if (!copyPayload.value || !navigator.clipboard?.writeText) {
    return
  }

  await navigator.clipboard.writeText(copyPayload.value)
  showToast('tags copied to clipboard')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1200)
}
</script>

<template>
  <button
    type="button"
    class="h-10 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
    :disabled="!copyPayload"
    :aria-label="copied ? 'Copied current tags' : 'Copy current tags'"
    @click="copyTags"
  >
    {{ copied ? 'Copied' : 'Copy' }}
  </button>
</template>

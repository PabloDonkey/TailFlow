<script setup lang="ts">
import AppErrorText from '../ui/AppErrorText.vue'

defineProps<{
  errorMsg: string | null
}>()

const emit = defineEmits<{ add: [] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="add-tag flex gap-2">
      <input
        v-model="model"
        data-testid="add-tag-input"
        placeholder="Add a tag…"
        class="tag-input min-w-0 flex-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
        @keyup.enter="emit('add')"
      >
      <button
        class="btn btn-primary rounded-[var(--tf-radius-md)] border-0 bg-[var(--tf-color-header-action-bg)] px-3 py-2 text-[var(--tf-color-header-text)]"
        @click="emit('add')"
      >
        Add
      </button>
    </div>

    <AppErrorText v-if="errorMsg">
      {{ errorMsg }}
    </AppErrorText>
  </div>
</template>

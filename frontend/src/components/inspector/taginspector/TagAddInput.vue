<script setup lang="ts">
const emit = defineEmits<{ add: [tag: string] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="add-tag flex gap-2">
    <input
      v-model="model"
      data-testid="add-tag-input"
      placeholder="Add a tag…"
      class="tag-input min-w-0 flex-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
      @keyup.enter="emit('add', model)"
    >
    <button
      class="btn btn-primary rounded-[var(--tf-radius-md)] border-0 bg-[var(--tf-color-header-action-bg)] px-3 py-2 text-[var(--tf-color-header-text)]"
      @click="emit('add', model)"
    >
      Add
    </button>
  </div>
</template>

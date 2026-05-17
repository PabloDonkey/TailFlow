<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  discovering: boolean
}>()

const emit = defineEmits<{
  openCreateProject: []
  discoverProjects: []
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="props.discovering"
      @click="emit('discoverProjects')"
    >
      {{ props.discovering ? 'Refreshing…' : 'Discover' }}
    </button>
    <button
      type="button"
      class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="props.loading"
      @click="emit('openCreateProject')"
    >
      Create Project
    </button>
  </div>
</template>

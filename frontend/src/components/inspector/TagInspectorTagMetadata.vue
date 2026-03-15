<script setup lang="ts">
defineProps<{
  roleLabel: string | null
  sourceLabel: string | null
}>()
</script>

<template>
  <span
    v-if="roleLabel"
    class="tag-badge rounded-full border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-1.5 py-0.5 text-[0.7rem]"
  >{{ roleLabel }}</span>
  <span
    v-if="sourceLabel"
    class="tag-badge rounded-full border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-1.5 py-0.5 text-[0.7rem]"
  >{{ sourceLabel }}</span>
</template>

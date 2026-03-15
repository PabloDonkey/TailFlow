<script setup lang="ts">
defineProps<{
  to: string
}>()

const linkClass =
  'rounded px-2 py-1 text-[0.95rem] font-medium text-[var(--tf-color-nav-text)] no-underline'
const activeLinkClass =
  'bg-[var(--tf-color-header-action-bg)] text-[var(--tf-color-header-text)]'
</script>

<template>
  <RouterLink
    :to="to"
    :class="linkClass"
    :active-class="activeLinkClass"
  >
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  fullWidth?: boolean
}>(), {
  fullWidth: false,
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <slot name="header" />
    <main
      :class="[
        'mx-auto flex w-full min-h-0 flex-1 flex-col p-3 md:p-4',
        fullWidth ? 'max-w-none' : 'max-w-[1400px]',
      ]"
    >
      <slot />
    </main>
  </div>
</template>

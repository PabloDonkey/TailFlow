<script setup lang="ts">
withDefaults(defineProps<{
  fullWidth?: boolean
}>(), {
  fullWidth: false,
})
</script>

<template>
  <div class="flex min-h-full flex-col">
    <slot name="header" />
    <main
      :class="[
        'mx-auto w-full flex-1 p-3 md:p-4',
        fullWidth ? 'max-w-none' : 'max-w-[1400px]',
      ]"
    >
      <slot />
    </main>
  </div>
</template>

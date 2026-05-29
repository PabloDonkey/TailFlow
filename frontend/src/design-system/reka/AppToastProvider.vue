<script setup lang="ts">
import { ToastProvider } from 'reka-ui'
</script>

<template>
  <ToastProvider v-bind="$attrs">
    <slot />
  </ToastProvider>
</template>

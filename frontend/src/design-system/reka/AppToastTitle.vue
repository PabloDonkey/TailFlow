<script setup lang="ts">
import { ToastTitle } from 'reka-ui'
</script>

<template>
  <ToastTitle v-bind="$attrs">
    <slot />
  </ToastTitle>
</template>

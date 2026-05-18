<script setup lang="ts">
import { TagsInputInput } from 'reka-ui'
</script>

<template>
  <TagsInputInput v-bind="$attrs">
    <slot />
  </TagsInputInput>
</template>

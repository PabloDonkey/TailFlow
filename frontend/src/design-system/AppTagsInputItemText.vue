<script setup lang="ts">
import { TagsInputItemText } from 'reka-ui'
</script>

<template>
  <TagsInputItemText v-bind="$attrs">
    <slot />
  </TagsInputItemText>
</template>

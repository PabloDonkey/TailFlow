<script setup lang="ts">
import AppButton from '../ui/AppButton.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'

defineProps<{
  projectName?: string
  overflowOpen?: boolean
}>()

defineEmits<{
  openProjectPicker: []
  openOverflow: []
}>()
</script>

<template>
  <header class="sticky top-0 z-[110] grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-[var(--tf-color-header-bg)] px-[0.8rem] py-[0.65rem] text-[var(--tf-color-header-text)] lg:px-4 lg:py-[0.8rem]">
    <AppButton
      aria-label="Open project picker"
      @click="$emit('openProjectPicker')"
    >
      ☰
    </AppButton>

    <div class="min-w-0">
      <AppText class="text-[0.7rem] text-[var(--tf-color-header-subtle)]">
        Current project
      </AppText>
      <AppSectionTitle
        as="h1"
        class="truncate text-[0.95rem] text-[var(--tf-color-header-text)] lg:text-base"
      >
        {{ projectName || 'No project selected' }}
      </AppSectionTitle>
    </div>

    <AppButton
      aria-label="Open workspace actions"
      aria-haspopup="menu"
      :aria-expanded="overflowOpen ? 'true' : 'false'"
      @click="$emit('openOverflow')"
    >
      ⋮
    </AppButton>
  </header>
</template>

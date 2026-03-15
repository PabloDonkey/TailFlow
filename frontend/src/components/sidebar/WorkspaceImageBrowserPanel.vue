<script setup lang="ts">
import { computed } from 'vue'
import { useImageStore, type ImageSortOption } from '../../stores/images'
import { getProjectImageFileUrl } from '../../api'
import { useDelayedLoading } from '../../composables/useDelayedLoading'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'

defineProps<{
  selectedProjectId: string | null
}>()

const emit = defineEmits<{
  selectImage: [imageId: string]
}>()

const imageStore = useImageStore()
const showLoading = useDelayedLoading(computed(() => imageStore.imagesLoading), 200)

const sortOptions: Array<{ value: ImageSortOption; label: string }> = [
  { value: 'name-asc', label: 'Name ↑' },
  { value: 'name-desc', label: 'Name ↓' },
  { value: 'tag-count-asc', label: 'Tags ↑' },
  { value: 'tag-count-desc', label: 'Tags ↓' },
]

function formatTagCount(tagCount: number): string {
  return `${tagCount} tag${tagCount === 1 ? '' : 's'}`
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <AppSectionTitle>Image Browser</AppSectionTitle>
      <label
        v-if="selectedProjectId && imageStore.sortedImages.length"
        class="inline-flex items-center gap-2 text-[0.8rem] text-[var(--tf-color-text-muted)]"
      >
        <span>Sort</span>
        <select
          v-model="imageStore.sortOption"
          data-testid="gallery-sort"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2 py-1 text-[0.8rem] text-[var(--tf-color-text-default)]"
        >
          <option
            v-for="option in sortOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <AppText v-if="!selectedProjectId">
      Select a project in Projects first.
    </AppText>
    <AppText v-else-if="showLoading">
      Loading…
    </AppText>
    <AppErrorText v-else-if="imageStore.error">
      {{ imageStore.error }}
    </AppErrorText>
    <AppText v-else-if="!imageStore.sortedImages.length">
      No images found for this project.
    </AppText>

    <div
      v-else
      class="grid grid-cols-2 gap-2"
    >
      <button
        v-for="img in imageStore.sortedImages"
        :key="img.id"
        type="button"
        class="card overflow-hidden rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-left"
        @click="emit('selectImage', img.id)"
      >
        <img
          :src="getProjectImageFileUrl(selectedProjectId!, img.id)"
          :alt="img.filename"
          class="block aspect-square w-full object-cover"
          loading="lazy"
        >
        <div class="flex items-center justify-between gap-1 px-2 py-1.5 text-[0.75rem]">
          <span
            class="name flex-1 truncate text-[var(--tf-color-text-default)]"
            :title="img.filename"
          >{{ img.filename }}</span>
          <span class="tag-count whitespace-nowrap text-[var(--tf-color-text-muted)]">{{ formatTagCount(img.tag_count) }}</span>
        </div>
      </button>
    </div>
  </section>
</template>

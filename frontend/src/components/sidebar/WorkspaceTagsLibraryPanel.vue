<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import { useTagStore } from '../../stores/tags'

withDefaults(defineProps<{
  showClose?: boolean
}>(), {
  showClose: false,
})

const emit = defineEmits<{
  close: []
}>()

const tagStore = useTagStore()
const newTagName = ref('')
const newTagCategory = ref('')
const errorMsg = ref<string | null>(null)

onMounted(async () => {
  if (!tagStore.tags.length) {
    await tagStore.fetchTags()
  }
})

async function createTag() {
  const name = newTagName.value.trim()
  if (!name) {
    return
  }

  errorMsg.value = null
  const createdTag = await tagStore.addTag(name, newTagCategory.value.trim() || undefined)
  if (createdTag) {
    newTagName.value = ''
    newTagCategory.value = ''
    return
  }

  errorMsg.value = tagStore.error ?? 'Failed to create tag'
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <AppSectionTitle>Tags Library</AppSectionTitle>
      <button
        v-if="showClose"
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2 py-1 text-sm text-[var(--tf-color-text-default)]"
        @click="emit('close')"
      >
        Back to Inspector
      </button>
    </div>

    <AppText tone="muted">
      Manage shared project tags and quickly add new entries.
    </AppText>

    <div class="flex flex-col gap-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2">
      <AppSectionTitle as="h3">
        Create Tag
      </AppSectionTitle>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="newTagName"
          data-testid="tags-library-name-input"
          placeholder="Tag name"
          class="min-w-0 flex-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
          @keyup.enter="createTag"
        >
        <input
          v-model="newTagCategory"
          data-testid="tags-library-category-input"
          placeholder="Category (optional)"
          class="min-w-0 flex-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2"
        >
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border-0 bg-[var(--tf-color-header-action-bg)] px-3 py-2 text-[var(--tf-color-header-text)]"
          :disabled="tagStore.loading"
          @click="createTag"
        >
          Add
        </button>
      </div>
      <AppErrorText v-if="errorMsg">
        {{ errorMsg }}
      </AppErrorText>
    </div>

    <AppText v-if="tagStore.loading">
      Loading…
    </AppText>

    <AppText
      v-else-if="!tagStore.tags.length"
      tone="muted"
    >
      No tags yet.
    </AppText>

    <ul
      v-else
      class="m-0 flex list-none flex-col gap-1.5 p-0"
    >
      <li
        v-for="tag in tagStore.tags"
        :key="tag.id"
        class="flex items-center gap-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2 py-1.5"
      >
        <span class="font-semibold text-[var(--tf-color-text-default)]">{{ tag.name }}</span>
        <span
          v-if="tag.category"
          class="rounded-[var(--tf-radius-sm)] bg-[var(--tf-color-surface-border)] px-1.5 py-0.5 text-[0.72rem] text-[var(--tf-color-text-muted)]"
        >{{ tag.category }}</span>
      </li>
    </ul>
  </section>
</template>
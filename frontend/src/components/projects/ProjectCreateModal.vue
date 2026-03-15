<script setup lang="ts">
import { ref } from 'vue'
import type { TaggingMode } from '../../api'
import { useProjectStore } from '../../stores/projects'

const emit = defineEmits<{
  close: []
  created: [projectId: string]
}>()

const projectStore = useProjectStore()
const folderName = ref('')
const classTag = ref('')
const name = ref('')
const triggerTag = ref('')
const taggingMode = ref<TaggingMode>('e621')
const formError = ref<string | null>(null)

function closeModal() {
  emit('close')
}

async function createProject() {
  formError.value = null

  const nextFolderName = folderName.value.trim()
  const nextClassTag = classTag.value.trim()

  if (!nextFolderName) {
    formError.value = 'Folder name is required.'
    return
  }
  if (!nextClassTag) {
    formError.value = 'Class tag is required.'
    return
  }

  const result = await projectStore.createProject({
    folder_name: nextFolderName,
    class_tag: nextClassTag,
    name: name.value.trim() || undefined,
    trigger_tag: triggerTag.value.trim() || undefined,
    tagging_mode: taggingMode.value,
  })

  if (!result?.project.id) {
    if (projectStore.error) {
      formError.value = projectStore.error
    }
    return
  }

  emit('created', result.project.id)
  closeModal()
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Create Project"
    @click="onBackdropClick"
  >
    <section class="w-full max-w-xl rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-4 shadow-xl">
      <header class="mb-3 flex items-center justify-between gap-3">
        <h2 class="m-0 text-base font-semibold text-[var(--tf-color-text-default)]">
          Create Project
        </h2>
        <button
          type="button"
          class="rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)]"
          @click="closeModal"
        >
          Close
        </button>
      </header>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label class="text-xs font-medium text-[var(--tf-color-text-muted)]">
          Folder Name
          <input
            v-model="folderName"
            type="text"
            class="mt-1 w-full rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--tf-color-text-default)]"
            placeholder="e.g. project-c"
          >
        </label>

        <label class="text-xs font-medium text-[var(--tf-color-text-muted)]">
          Class Tag
          <input
            v-model="classTag"
            type="text"
            class="mt-1 w-full rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--tf-color-text-default)]"
            placeholder="e.g. character"
          >
        </label>

        <label class="text-xs font-medium text-[var(--tf-color-text-muted)]">
          Display Name (optional)
          <input
            v-model="name"
            type="text"
            class="mt-1 w-full rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--tf-color-text-default)]"
            placeholder="e.g. Project C"
          >
        </label>

        <label class="text-xs font-medium text-[var(--tf-color-text-muted)]">
          Trigger Tag (optional)
          <input
            v-model="triggerTag"
            type="text"
            class="mt-1 w-full rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--tf-color-text-default)]"
            placeholder="defaults to folder"
          >
        </label>

        <label class="text-xs font-medium text-[var(--tf-color-text-muted)] sm:col-span-2">
          Tagging Mode
          <select
            v-model="taggingMode"
            class="mt-1 w-full rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--tf-color-text-default)]"
            data-testid="modal-create-tagging-mode"
          >
            <option value="e621">
              e621
            </option>
            <option value="booru">
              booru
            </option>
          </select>
        </label>
      </div>

      <p
        v-if="formError"
        class="mt-3 rounded-[var(--tf-radius-sm)] border border-red-300/70 bg-red-100/50 px-2 py-1.5 text-xs text-red-700"
      >
        {{ formError }}
      </p>

      <footer class="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--tf-color-text-default)]"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--tf-color-on-accent)] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="projectStore.creating"
          @click="createProject"
        >
          {{ projectStore.creating ? 'Creating…' : 'Create Project' }}
        </button>
      </footer>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Project, TaggingMode } from '../../../api'
import { useProjectStore } from '../../../stores/projects'

const props = defineProps<{
  selectedProject: Project | null
}>()

const projectStore = useProjectStore()

const uploadFormError = ref<string | null>(null)
const selectedUploadFiles = ref<File[]>([])
const editTriggerTag = ref('')
const editClassTag = ref('')
const editTaggingMode = ref<TaggingMode>('e621')
const editFormError = ref<string | null>(null)

watch(
  () => props.selectedProject,
  () => {
    startEditingSelectedProject()
  },
  { immediate: true },
)

async function syncProject() {
  await projectStore.syncSelectedProject()
}

function onUploadFilesChanged(event: Event) {
  const input = event.target as HTMLInputElement
  selectedUploadFiles.value = Array.from(input.files ?? [])
  uploadFormError.value = null
}

async function uploadFilesToProject() {
  uploadFormError.value = null

  if (!props.selectedProject) {
    uploadFormError.value = 'Select a project first.'
    return
  }

  if (selectedUploadFiles.value.length === 0) {
    uploadFormError.value = 'Select one or more image files to upload.'
    return
  }

  const result = await projectStore.uploadImagesToSelectedProject(selectedUploadFiles.value)
  if (result) {
    selectedUploadFiles.value = []
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString()
}

function startEditingSelectedProject() {
  if (!props.selectedProject) {
    editTriggerTag.value = ''
    editClassTag.value = ''
    editTaggingMode.value = 'e621'
    return
  }

  editTriggerTag.value = props.selectedProject.trigger_tag
  editClassTag.value = props.selectedProject.class_tag
  editTaggingMode.value = props.selectedProject.tagging_mode
}

async function saveProjectMetadata() {
  editFormError.value = null
  if (!props.selectedProject) {
    editFormError.value = 'Select a project first.'
    return
  }

  const triggerTag = editTriggerTag.value.trim()
  const classTag = editClassTag.value.trim()
  if (!triggerTag || !classTag) {
    editFormError.value = 'Trigger tag and class tag are required.'
    return
  }

  const updated = await projectStore.updateSelectedProjectMetadata({
    trigger_tag: triggerTag,
    class_tag: classTag,
    tagging_mode: editTaggingMode.value,
  })
  if (!updated && projectStore.error) {
    editFormError.value = projectStore.error
  }
}
</script>

<template>
  <section class="project-details">
    <h2>Project Details</h2>
    <p
      v-if="!selectedProject"
      class="empty"
    >
      Select a project to inspect metadata.
    </p>
    <div
      v-else
      class="details-card"
    >
      <dl>
        <div class="row">
          <dt>Folder</dt>
          <dd>{{ selectedProject.folder_name }}</dd>
        </div>
        <div class="row">
          <dt>Trigger Tag</dt>
          <dd>
            <input
              v-model="editTriggerTag"
              type="text"
            >
          </dd>
        </div>
        <div class="row">
          <dt>Class Tag</dt>
          <dd>
            <input
              v-model="editClassTag"
              type="text"
            >
          </dd>
        </div>
        <div class="row">
          <dt>Tagging Mode</dt>
          <dd>
            <select
              v-model="editTaggingMode"
              data-testid="edit-tagging-mode"
            >
              <option value="e621">
                e621
              </option>
              <option value="booru">
                booru
              </option>
            </select>
            <p class="field-help">
              Shared user-defined tags stay available in both modes.
            </p>
          </dd>
        </div>
        <div class="row">
          <dt>Dataset Path</dt>
          <dd>{{ selectedProject.dataset_path }}</dd>
        </div>
        <div class="row">
          <dt>Last Synced</dt>
          <dd>{{ formatDate(selectedProject.last_synced_at) }}</dd>
        </div>
        <div class="row">
          <dt>Status</dt>
          <dd>{{ selectedProject.missing_at ? 'Missing' : 'Present' }}</dd>
        </div>
      </dl>

      <button
        class="btn btn-secondary"
        :disabled="projectStore.syncing"
        @click="syncProject"
      >
        {{ projectStore.syncing ? 'Syncing…' : 'Sync Project' }}
      </button>
      <button
        class="btn btn-secondary"
        :disabled="projectStore.updating"
        @click="saveProjectMetadata"
      >
        {{ projectStore.updating ? 'Saving…' : 'Save Metadata' }}
      </button>
      <p
        v-if="editFormError"
        class="error"
      >
        {{ editFormError }}
      </p>

      <p
        v-if="projectStore.lastSync"
        class="status"
      >
        Sync: +{{ projectStore.lastSync.added_images }} added,
        -{{ projectStore.lastSync.removed_images }} removed,
        {{ projectStore.lastSync.restored_images }} restored.
      </p>

      <div
        class="upload-box"
        :class="{ disabled: selectedProject.missing_at !== null }"
      >
        <h3>Upload Images to Project</h3>
        <input
          type="file"
          aria-label="Upload images to project"
          accept="image/*"
          multiple
          :disabled="selectedProject.missing_at !== null"
          @change="onUploadFilesChanged"
        >
        <button
          class="btn btn-primary"
          :disabled="projectStore.uploading || selectedProject.missing_at !== null"
          @click="uploadFilesToProject"
        >
          {{ projectStore.uploading ? 'Uploading…' : 'Upload to Dataset' }}
        </button>
        <p
          v-if="selectedProject.missing_at"
          class="error"
        >
          Upload disabled because this project's folder is missing.
        </p>
        <p
          v-else-if="uploadFormError"
          class="error"
        >
          {{ uploadFormError }}
        </p>
        <p
          v-if="projectStore.lastUpload"
          class="status success"
        >
          Upload complete: {{ projectStore.lastUpload.uploaded_files.length }} file(s),
          {{ projectStore.lastUpload.created_records }} record(s) created,
          {{ projectStore.lastUpload.restored_records }} restored.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.project-details {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
}

h2 {
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.details-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty {
  color: #666;
}

.error {
  color: #c00;
  background: #fee;
  padding: 0.5rem;
  border-radius: 4px;
}

.status {
  color: #444;
  font-size: 0.9rem;
}

.status.success {
  color: #0b6b0b;
}

.btn {
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
}

.btn-primary {
  background: #4a4e8a;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  background: #e0e0e0;
  color: #222;
}

.upload-box {
  border-top: 1px solid #eceff5;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.upload-box.disabled {
  opacity: 0.85;
}

dl {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem;
}

dt {
  color: #555;
  font-weight: 600;
}

dd {
  color: #222;
  word-break: break-word;
}

input[type='text'],
select,
input[type='file'] {
  border: 1px solid #cfd4e2;
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  font-size: 0.92rem;
}

.field-help {
  margin-top: 0.35rem;
  color: #666;
  font-size: 0.82rem;
}
</style>

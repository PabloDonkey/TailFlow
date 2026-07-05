<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  applyProjectDatasetRename,
  previewProjectDatasetRename,
  type Project,
  type ProjectDatasetRenamePreviewResponse,
  type TaggingMode,
} from '../../../api'
import { getActivePinia } from 'pinia'
import { useImageStore } from '../../../stores/images'
import { useProjectStore } from '../../../stores/projects'
import AppAlertDialog from '../../../design-system/reka/AppAlertDialog.vue'

const props = defineProps<{
  selectedProject: Project | null
}>()

const projectStore = useProjectStore()

function activeImageStore() {
  return getActivePinia() ? useImageStore() : null
}

const uploadFormError = ref<string | null>(null)
const selectedUploadFiles = ref<File[]>([])
const editTriggerTag = ref('')
const editClassTag = ref('')
const editTaggingMode = ref<TaggingMode>('e621')
const editFormError = ref<string | null>(null)
const renamePreview = ref<ProjectDatasetRenamePreviewResponse | null>(null)
const renameStatus = ref<string | null>(null)
const renameError = ref<string | null>(null)
const renamePreviewLoading = ref(false)
const renameApplyLoading = ref(false)
const showDeleteProjectConfirm = ref(false)
const deleteProjectError = ref<string | null>(null)

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
    showDeleteProjectConfirm.value = false
    deleteProjectError.value = null
    return
  }

  editTriggerTag.value = props.selectedProject.trigger_tag
  editClassTag.value = props.selectedProject.class_tag
  editTaggingMode.value = props.selectedProject.tagging_mode
  renamePreview.value = null
  renameStatus.value = null
  renameError.value = null
  showDeleteProjectConfirm.value = false
  deleteProjectError.value = null
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

async function previewDatasetRenamePlan() {
  renameError.value = null
  renameStatus.value = null
  if (!props.selectedProject) {
    renameError.value = 'Select a project first.'
    return
  }

  renamePreviewLoading.value = true
  try {
    renamePreview.value = await previewProjectDatasetRename(props.selectedProject.id)
  } catch (error) {
    renameError.value = String(error)
  } finally {
    renamePreviewLoading.value = false
  }
}

async function applyDatasetRenamePlan() {
  renameError.value = null
  renameStatus.value = null
  if (!props.selectedProject) {
    renameError.value = 'Select a project first.'
    return
  }

  if (!renamePreview.value) {
    renameError.value = 'Run dry-run preview first.'
    return
  }

  renameApplyLoading.value = true
  try {
    const result = await applyProjectDatasetRename(props.selectedProject.id)
    renameStatus.value = `Applied: ${result.renamed_images} image(s) renamed, ${result.sidecars_updated} sidecar file(s) updated.`
    renamePreview.value = await previewProjectDatasetRename(props.selectedProject.id)

    await projectStore.fetchProjects()
    if (projectStore.selectedProjectId) {
      const imageStore = activeImageStore()
      if (!imageStore) {
        return
      }

      await imageStore.fetchImages(projectStore.selectedProjectId)
      const currentImageId = imageStore.currentImage?.id
      if (currentImageId) {
        await imageStore.fetchImage(projectStore.selectedProjectId, currentImageId)
      }
    }
  } catch (error) {
    renameError.value = String(error)
  } finally {
    renameApplyLoading.value = false
  }
}

function requestDeleteProject() {
  deleteProjectError.value = null
  showDeleteProjectConfirm.value = true
}

async function confirmDeleteProject() {
  showDeleteProjectConfirm.value = false
  deleteProjectError.value = null
  if (!props.selectedProject) {
    deleteProjectError.value = 'Select a project first.'
    return
  }

  const deleted = await projectStore.deleteProject(props.selectedProject.id)
  if (!deleted) {
    deleteProjectError.value = projectStore.error ?? 'Failed to delete project.'
  }
}
</script>

<template>
  <div
    v-if="selectedProject"
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

    <div
      class="upload-box"
      :class="{ disabled: selectedProject.missing_at !== null }"
    >
      <h3>Rename Dataset + Update Sidecars</h3>
      <p class="field-help">
        Dry-run previews stable numeric names (1, 2, 3...) preserving each file extension, then apply renames in-place and write matching .txt sidecars.
      </p>

      <div class="actions-row">
        <button
          class="btn btn-secondary"
          :disabled="renamePreviewLoading || renameApplyLoading || selectedProject.missing_at !== null"
          @click="previewDatasetRenamePlan"
        >
          {{ renamePreviewLoading ? 'Previewing…' : 'Dry-run Preview' }}
        </button>

        <button
          class="btn btn-primary"
          :disabled="renameApplyLoading || renamePreviewLoading || selectedProject.missing_at !== null || !renamePreview"
          @click="applyDatasetRenamePlan"
        >
          {{ renameApplyLoading ? 'Applying…' : 'Apply Rename + Sidecars' }}
        </button>
      </div>

      <p
        v-if="selectedProject.missing_at"
        class="error"
      >
        Rename disabled because this project's folder is missing.
      </p>

      <p
        v-else-if="renameError"
        class="error"
      >
        {{ renameError }}
      </p>

      <p
        v-if="renameStatus"
        class="status success"
      >
        {{ renameStatus }}
      </p>

      <div
        v-if="renamePreview"
        class="rename-preview"
      >
        <p class="status">
          Preview: {{ renamePreview.total_images }} image(s), {{ renamePreview.rename_count }} rename(s), {{ renamePreview.sidecar_update_count }} sidecar update(s).
        </p>

        <ul class="preview-list">
          <li
            v-for="item in renamePreview.items"
            :key="item.image_id"
          >
            <strong>{{ item.current_relative_path }}</strong> → {{ item.proposed_relative_path }}
          </li>
        </ul>
      </div>
    </div>

    <div class="danger-zone">
      <h3>Delete Project</h3>
      <p class="field-help">
        This action cannot be undone.
      </p>
      <button
        class="btn btn-danger"
        :disabled="projectStore.deleting"
        @click="requestDeleteProject"
      >
        {{ projectStore.deleting ? 'Deleting…' : 'Delete Project' }}
      </button>
      <p
        v-if="deleteProjectError"
        class="error"
      >
        {{ deleteProjectError }}
      </p>
    </div>

    <AppAlertDialog
      :open="showDeleteProjectConfirm"
      title="Delete project?"
      :description="selectedProject ? `This action cannot be undone. Delete ${selectedProject.name} and all project files.` : 'This action cannot be undone.'"
      confirm-label="Delete Project"
      cancel-label="Cancel"
      @update:open="(open) => (showDeleteProjectConfirm = open)"
      @confirm="confirmDeleteProject"
    />
  </div>
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

.btn-danger {
  background: #c62828;
  color: #fff;
}

.btn-danger:disabled {
  opacity: 0.6;
}

.upload-box {
  border-top: 1px solid #eceff5;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.danger-zone {
  border-top: 1px solid #f2d0d0;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.upload-box.disabled {
  opacity: 0.85;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.rename-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.preview-list {
  margin: 0;
  padding-left: 1rem;
  max-height: 12rem;
  overflow: auto;
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

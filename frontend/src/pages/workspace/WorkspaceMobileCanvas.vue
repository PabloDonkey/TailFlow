<script setup lang="ts">
import { ref } from 'vue'
import WorkspaceMobileSplitLayout from '../../components/layout/WorkspaceMobileSplitLayout.vue'
import AppAlertDialog from '../../design-system/reka/AppAlertDialog.vue'
import MotionSwipe from '../../design-system/motion/MotionSwipe.vue'

type PanelOption = {
  id: string
  label: string
}

type PanelAction = {
  id: string
  label: string
}

const props = defineProps<{
  splitPercent: number
  panelTitle: string
  panelOptions: PanelOption[]
  activePanelId: string
  currentPanelActions?: PanelAction[]
  showPanelScanButton?: boolean
  showPanelSelectedToggleButton?: boolean
  currentImageExists: boolean
  currentImageIsFeatured: boolean
  currentImageFilename?: string
  canGoToPrevious: boolean
  canGoToNext: boolean
  rounded?: boolean
}>()

const emit = defineEmits<{
  'update:splitPercent': [value: number]
  'select-panel': [panelId: string]
  'select-action': [actionId: string]
  'delete-confirm': []
  'go-back': []
  'navigate-previous': []
  'navigate-next': []
  'scan-panel': []
  'toggle-panel-selected-filter': []
  'replace-image': [file: File]
  'upload-images': [files: File[]]
  'set-featured': []
}>()

const showDeleteConfirm = ref(false)
const showCanvasActionsMenu = ref(false)
const replaceInputRef = ref<HTMLInputElement | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)

function handleDeleteConfirm(): void {
  showDeleteConfirm.value = false
  emit('delete-confirm')
}

function openReplacePicker(): void {
  showCanvasActionsMenu.value = false
  if (!props.currentImageExists) {
    return
  }
  replaceInputRef.value?.click()
}

function openUploadPicker(): void {
  showCanvasActionsMenu.value = false
  uploadInputRef.value?.click()
}

function setFeaturedImage(): void {
  showCanvasActionsMenu.value = false
  if (!props.currentImageExists || props.currentImageIsFeatured) {
    return
  }
  emit('set-featured')
}

function onReplaceFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  emit('replace-image', file)
  input.value = ''
}

function onUploadFilesChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) {
    return
  }
  emit('upload-images', files)
  input.value = ''
}
</script>

<template>
  <div class="relative h-full min-h-0">
    <WorkspaceMobileSplitLayout
      :split-percent="splitPercent"
      :panel-title="panelTitle"
      :panel-options="panelOptions"
      :active-panel-id="activePanelId"
      :current-panel-actions="currentPanelActions"
      :rounded="rounded"
      @update:split-percent="(value) => emit('update:splitPercent', value)"
      @select-panel="(panelId) => emit('select-panel', panelId)"
      @select-action="(actionId) => emit('select-action', actionId)"
    >
      <template #header-actions>
        <div class="flex items-center gap-2">
          <button
            v-if="props.showPanelSelectedToggleButton"
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
            @click="emit('toggle-panel-selected-filter')"
          >
            Selected
          </button>

          <button
            v-if="props.showPanelScanButton"
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!props.currentImageExists"
            @click="emit('scan-panel')"
          >
            Scan now
          </button>
        </div>
      </template>

      <template #canvas-header-actions>
        <div class="flex items-center gap-2">
          <input
            ref="replaceInputRef"
            type="file"
            accept="image/*"
            class="sr-only"
            aria-label="Replace current image"
            @change="onReplaceFileChange"
          >
          <input
            ref="uploadInputRef"
            type="file"
            accept="image/*"
            multiple
            class="sr-only"
            aria-label="Upload images to dataset"
            @change="onUploadFilesChange"
          >

          <div class="relative">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)]"
              aria-label="Open canvas image actions menu"
              @click="showCanvasActionsMenu = !showCanvasActionsMenu"
            >
              ...
            </button>

            <div
              v-if="showCanvasActionsMenu"
              class="absolute right-0 top-[calc(100%+0.25rem)] z-20 flex min-w-44 flex-col gap-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1 shadow-md"
            >
              <button
                type="button"
                class="flex items-center justify-between rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!props.currentImageExists || props.currentImageIsFeatured"
                @click="setFeaturedImage"
              >
                <span>Set as featured image</span>
                <span
                  v-if="props.currentImageIsFeatured"
                  aria-label="Current image is featured"
                  class="text-[var(--tf-color-success)]"
                >
                  [x]
                </span>
              </button>
              <button
                type="button"
                class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!props.currentImageExists"
                @click="openReplacePicker"
              >
                Replace image
              </button>
              <button
                type="button"
                class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)]"
                @click="openUploadPicker"
              >
                Upload image
              </button>
              <button
                type="button"
                class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-danger)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!props.currentImageExists"
                @click="showDeleteConfirm = true"
              >
                Delete current image
              </button>
            </div>
          </div>

          <button
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
            @click="emit('go-back')"
          >
            Back
          </button>
        </div>
      </template>

      <template #canvas>
        <MotionSwipe
          class="h-full min-h-0"
          :min-distance="80"
          :on-swipe-left="props.canGoToNext ? () => emit('navigate-next') : undefined"
          :on-swipe-right="props.canGoToPrevious ? () => emit('navigate-previous') : undefined"
        >
          <slot name="canvas" />
        </MotionSwipe>
      </template>

      <template #panel>
        <slot name="panel" />
      </template>
    </WorkspaceMobileSplitLayout>

    <AppAlertDialog
      :open="showDeleteConfirm"
      title="Delete current image?"
      :description="currentImageFilename
        ? `This permanently deletes ${currentImageFilename} from the project dataset.`
        : 'This permanently deletes the current image from the project dataset.'"
      confirm-label="Delete"
      @update:open="(open) => (showDeleteConfirm = open)"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

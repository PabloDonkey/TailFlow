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
}>()

const showDeleteConfirm = ref(false)

function handleDeleteConfirm(): void {
  showDeleteConfirm.value = false
  emit('delete-confirm')
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
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] text-[var(--tf-color-text-muted)] transition hover:border-[var(--tf-color-danger)] hover:text-[var(--tf-color-danger)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Delete current image"
            :disabled="!currentImageExists"
            @click="showDeleteConfirm = true"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>

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

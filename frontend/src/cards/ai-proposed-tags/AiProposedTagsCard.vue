<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { classifyProjectImage } from '../../api'
import type { ProjectTag, TaggingMode } from '../../api'
import AppNumberField from '../../design-system/reka/AppNumberField.vue'
import AppSelectField from '../../design-system/reka/AppSelectField.vue'
import AppSwitchField from '../../design-system/reka/AppSwitchField.vue'
import AppText from '../../components/ui/AppText.vue'
import { useTagListFilter } from '../../composables/useTagListFilter'
import TagListFilterInput from '../shared/TagListFilterInput.vue'
import TagsTextareaField from '../shared/TagsTextareaField.vue'

let aiInspectorRegionCounter = 0
const AI_CONTROLS_COLLAPSED_STORAGE_KEY = 'tailflow.ai-proposed-tags.controls-collapsed.v1'

interface ProposedTag {
  name: string
  confidence: number
}

const props = withDefaults(defineProps<{
  projectId: string | null
  imageId: string | null
  mode: TaggingMode
  currentTags: ProjectTag[]
  scanRequestNonce?: number
  selectedToggleRequestNonce?: number
  disabled?: boolean
  framed?: boolean
  showTopBar?: boolean
  showFilter?: boolean
  showScanControls?: boolean
  showAdvancedControls?: boolean
  showTagsList?: boolean
  showControlsToggle?: boolean
  showSelectedToggle?: boolean
  showInlineScanButton?: boolean
}>(), {
  disabled: false,
  framed: true,
  scanRequestNonce: 0,
  selectedToggleRequestNonce: 0,
  showTopBar: true,
  showFilter: true,
  showScanControls: true,
  showAdvancedControls: true,
  showTagsList: true,
  showControlsToggle: true,
  showSelectedToggle: true,
  showInlineScanButton: true,
})

const emit = defineEmits<{
  add: [tagName: string]
  remove: [tagName: string]
}>()

const modelOptions = [
  { label: 'JTP_PILOT', value: 'jtp_pilot' },
  { label: 'JTP_PILOT2', value: 'jtp_pilot2' },
  { label: 'JTP-3 Hydra', value: 'jtp-3-hydra' },
] satisfies { label: string; value: string }[]

const selectedModel = ref('jtp-3-hydra')
const autoScan = ref(true)
const controlsCollapsed = ref(false)
const proposedFilterMode = ref<'all' | 'selected'>('all')
const confidenceThreshold = ref(0.35)
const isScanning = ref(false)
const scanError = ref<string | null>(null)
const proposedTags = ref<ProposedTag[]>([])
const modelAvailable = ref(true)
const downloadProgressPercent = ref(100)
const downloadProposalUrl = ref<string | null>(null)
const downloadMessage = ref<string | null>(null)
aiInspectorRegionCounter += 1
const aiRegionId = `ai-proposed-tags-region-${aiInspectorRegionCounter}`
const aiHeadingId = `ai-proposed-tags-heading-${aiRegionId}`
const aiControlsId = `ai-proposed-tags-controls-${aiRegionId}`
const aiListId = `ai-proposed-tags-list-${aiRegionId}`

let scanTimer: ReturnType<typeof setTimeout> | null = null

const normalizedCurrentTagSet = computed(() =>
  new Set(props.currentTags.map((tag) => tag.name.trim().toLowerCase())),
)

const visibleProposedTags = computed(() => {
  const minConfidence = confidenceThreshold.value
  return proposedTags.value
    .filter((tag) => tag.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
})

const selectedProposedTags = computed(() =>
  visibleProposedTags.value.filter((tag) => isAlreadyApplied(tag.name)),
)

const modeFilteredProposedTags = computed(() =>
  proposedFilterMode.value === 'selected'
    ? selectedProposedTags.value
    : visibleProposedTags.value,
)

const {
  filterQuery: proposedFilterQuery,
  filteredItems: filteredProposedTags,
} = useTagListFilter(modeFilteredProposedTags, (tag) => tag.name)

const displayProposedTags = computed(() =>
  filteredProposedTags.value.map((tag) => {
    const selected = isAlreadyApplied(tag.name)
    return {
      key: tag.name,
      label: tag.name,
      metaInline: `${Math.round(tag.confidence * 100)}%`,
      meta: null,
      variant: selected ? 'selected' as const : 'default' as const,
      actionIcon: null,
      actionAriaLabel: selected ? `Remove tag ${tag.name}` : `Add tag ${tag.name}`,
      actionDisabled: props.disabled,
    }
  }),
)

const autoScanHelpText = computed(() => {
  if (autoScan.value) {
    return 'Keeps proposals in sync while browsing images.'
  }
  return 'Auto-scan is disabled. Use Scan now to refresh proposals.'
})

const showExpandedControls = computed(() => {
  if (!props.showAdvancedControls) {
    return false
  }

  if (!props.showControlsToggle) {
    return true
  }

  // If top bar is hidden (advanced-only mobile mode), keep controls visible.
  if (!props.showTopBar) {
    return true
  }

  return !controlsCollapsed.value
})

const listAriaDescribedBy = computed(() => {
  if (!props.showAdvancedControls) {
    return undefined
  }

  return aiControlsId
})

async function runScan(): Promise<void> {
  if (!props.projectId || !props.imageId || props.disabled) {
    proposedTags.value = []
    modelAvailable.value = true
    downloadProgressPercent.value = 100
    downloadProposalUrl.value = null
    downloadMessage.value = null
    return
  }

  isScanning.value = true
  scanError.value = null

  try {
    const response = await classifyProjectImage(props.projectId, props.imageId, {
      model_id: selectedModel.value,
      threshold: confidenceThreshold.value,
      max_tags: 128,
    })

    modelAvailable.value = response.model_available
    downloadProgressPercent.value = response.download_progress_percent
    downloadProposalUrl.value = response.download_proposal_url
    downloadMessage.value = response.download_message

    if (!response.model_available) {
      proposedTags.value = []
      scanError.value = response.download_message ?? 'Model files are missing.'
      return
    }

    proposedTags.value = response.suggestions
  } catch {
    modelAvailable.value = true
    downloadProgressPercent.value = 100
    downloadProposalUrl.value = null
    downloadMessage.value = null
    scanError.value = 'Unable to scan tags right now.'
  } finally {
    isScanning.value = false
  }
}

function scheduleAutoScan(): void {
  if (!autoScan.value) {
    return
  }
  if (scanTimer) {
    clearTimeout(scanTimer)
  }
  scanTimer = setTimeout(() => {
    void runScan()
  }, 200)
}

function isAlreadyApplied(tagName: string): boolean {
  return normalizedCurrentTagSet.value.has(tagName.trim().toLowerCase())
}

function toggleProposedTag(tagName: string): void {
  if (props.disabled) {
    return
  }
  if (isAlreadyApplied(tagName)) {
    emit('remove', tagName)
    return
  }
  emit('add', tagName)
}

function toggleSelectedMode(): void {
  proposedFilterMode.value = proposedFilterMode.value === 'selected' ? 'all' : 'selected'
}

function toggleControls(): void {
  controlsCollapsed.value = !controlsCollapsed.value
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  const raw = window.localStorage.getItem(AI_CONTROLS_COLLAPSED_STORAGE_KEY)
  if (raw === '1') {
    controlsCollapsed.value = true
  }
})

watch(
  [() => props.projectId, () => props.imageId, () => props.mode, selectedModel],
  () => {
    scheduleAutoScan()
  },
  { immediate: true },
)

watch(autoScan, (enabled) => {
  if (enabled) {
    scheduleAutoScan()
  }
})

watch(
  () => props.scanRequestNonce,
  () => {
    void runScan()
  },
)

watch(
  () => props.selectedToggleRequestNonce,
  () => {
    toggleSelectedMode()
  },
)

watch(controlsCollapsed, (collapsed) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(AI_CONTROLS_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
})

onBeforeUnmount(() => {
  if (scanTimer) {
    clearTimeout(scanTimer)
  }
})
</script>

<template>
  <section
    class="flex h-full min-h-0 flex-col bg-[var(--tf-color-surface)]"
    :class="props.framed ? 'rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] p-3' : ''"
    role="region"
    :aria-labelledby="aiHeadingId"
  >
    <div
      class="flex min-h-0 flex-1 flex-col"
      :class="props.framed ? 'gap-3 pt-3' : 'gap-2'"
    >
      <div
        v-if="props.showTopBar"
        class="flex flex-wrap items-center gap-2 text-xs text-[var(--tf-color-text-muted)]"
      >
        <button
          v-if="props.showSelectedToggle"
          type="button"
          class="cursor-pointer rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)]"
          :class="proposedFilterMode === 'selected' ? 'bg-[var(--tf-color-surface-alt)]' : ''"
          aria-label="Toggle selected proposed tags filter"
          @click="toggleSelectedMode"
        >
          Selected: {{ selectedProposedTags.length }}/{{ visibleProposedTags.length }}
        </button>

        <span v-if="props.showAdvancedControls">
          Threshold: {{ Math.round(confidenceThreshold * 100) }}%
        </span>

        <button
          v-if="props.showScanControls && props.showInlineScanButton"
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!imageId || disabled || isScanning"
          @click="runScan"
        >
          {{ isScanning ? 'Scanning…' : 'Scan now' }}
        </button>

        <button
          v-if="props.showAdvancedControls && props.showControlsToggle"
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)]"
          :aria-controls="aiControlsId"
          :aria-expanded="!controlsCollapsed"
          @click="toggleControls"
        >
          {{ controlsCollapsed ? 'Show controls' : 'Hide controls' }}
        </button>

        <template v-if="props.showScanControls && !modelAvailable">
          <span>Download progress: {{ downloadProgressPercent }}%</span>
        </template>
      </div>

      <div
        v-show="showExpandedControls"
        :id="aiControlsId"
        class="grid gap-3 md:grid-cols-2"
        role="group"
        aria-label="AI proposed tags controls"
      >
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">Model</span>
          <AppSelectField
            :model-value="selectedModel"
            :options="modelOptions"
            aria-label="Model"
            placeholder="Choose model"
            :disabled="disabled"
            @update:model-value="(value) => selectedModel = value"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">Confidence</span>
          <AppNumberField
            :model-value="confidenceThreshold"
            aria-label="Confidence threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :disabled="disabled"
            @update:model-value="(value) => confidenceThreshold = value"
          />
        </label>

        <div class="md:col-span-2 flex items-center justify-between rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-alt)] px-3 py-2">
          <div>
            <p class="text-sm font-medium text-[var(--tf-color-text-default)]">
              Auto-scan on image change
            </p>
            <p class="text-xs text-[var(--tf-color-text-muted)]">
              {{ autoScanHelpText }}
            </p>
          </div>

          <AppSwitchField
            :model-value="autoScan"
            aria-label="Toggle auto scan"
            :disabled="disabled"
            @update:model-value="(value) => autoScan = value"
          />
        </div>
      </div>

      <div
        v-if="!modelAvailable"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-alt)] px-3 py-2 text-xs text-[var(--tf-color-text-default)]"
      >
        <p class="font-medium">
          Selected model is not installed.
        </p>
        <p
          v-if="downloadMessage"
          class="mt-1"
        >
          {{ downloadMessage }}
        </p>
        <p
          v-if="downloadProposalUrl"
          class="mt-1 break-all"
        >
          Download source: <a
            :href="downloadProposalUrl"
            target="_blank"
            rel="noreferrer"
          >{{ downloadProposalUrl }}</a>
        </p>
      </div>

      <div
        v-if="props.showTagsList"
        :id="aiListId"
        class="min-h-0 flex flex-1 flex-col"
        role="group"
        aria-label="AI proposed tags list"
        :aria-describedby="listAriaDescribedBy"
      >
        <div
          v-if="props.showFilter"
          class="mb-2 grid grid-cols-1"
        >
          <TagListFilterInput
            v-model="proposedFilterQuery"
            placeholder="Filter proposed tags"
            aria-label="Filter proposed tags"
          />
        </div>

        <AppText
          v-if="scanError"
          tone="muted"
          class="text-[var(--tf-color-danger)]"
        >
          {{ scanError }}
        </AppText>

        <AppText
          v-else-if="!imageId"
          tone="muted"
        >
          Select an image to generate proposals.
        </AppText>

        <AppText
          v-else-if="isScanning"
          tone="muted"
        >
          Running AI scan…
        </AppText>

        <AppText
          v-else-if="!filteredProposedTags.length"
          tone="muted"
        >
          {{ visibleProposedTags.length ? 'No proposals match the current filter.' : 'No proposals above the selected threshold.' }}
        </AppText>

        <TagsTextareaField
          v-else
          class="min-h-0 flex-1"
          :items="displayProposedTags"
          placeholder="AI proposed tags..."
          :disabled="disabled"
          click-to-action
          @action="toggleProposedTag"
        />
      </div>
    </div>
  </section>
</template>

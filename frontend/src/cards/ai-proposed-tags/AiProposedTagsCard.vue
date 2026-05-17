<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { classifyProjectImage } from '../../api'
import type { ProjectTag, TaggingMode } from '../../api'
import AppNumberField from '../../design-system/AppNumberField.vue'
import AppSelectField from '../../design-system/AppSelectField.vue'
import AppSwitchField from '../../design-system/AppSwitchField.vue'
import AppText from '../../components/ui/AppText.vue'
import TagActionRow from '../shared/TagActionRow.vue'

let aiInspectorRegionCounter = 0

interface ProposedTag {
  name: string
  confidence: number
}

const props = withDefaults(defineProps<{
  projectId: string | null
  imageId: string | null
  mode: TaggingMode
  currentTags: ProjectTag[]
  disabled?: boolean
  framed?: boolean
  getTagRoleLabel: (tag: ProjectTag) => string | null
}>(), {
  disabled: false,
  framed: true,
})

const emit = defineEmits<{
  add: [tagName: string]
}>()

const modelOptions = [
  { label: 'JTP_PILOT', value: 'jtp_pilot' },
  { label: 'JTP_PILOT2', value: 'jtp_pilot2' },
  { label: 'JTP-3 Hydra', value: 'jtp-3-hydra' },
] satisfies { label: string; value: string }[]

const selectedModel = ref('jtp-3-hydra')
const autoScan = ref(true)
const controlsCollapsed = ref(false)
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

const currentTagByName = computed(() => {
  const map = new Map<string, ProjectTag>()
  for (const tag of props.currentTags) {
    map.set(tag.name.trim().toLowerCase(), tag)
  }
  return map
})

const visibleProposedTags = computed(() => {
  const minConfidence = confidenceThreshold.value
  return proposedTags.value
    .filter((tag) => tag.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
})

const autoScanHelpText = computed(() => {
  if (autoScan.value) {
    return 'Keeps proposals in sync while browsing images.'
  }
  return 'Auto-scan is disabled. Use Scan now to refresh proposals.'
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

function roleLabelForName(tagName: string): string | null {
  const matched = currentTagByName.value.get(tagName.trim().toLowerCase())
  if (!matched) {
    return null
  }
  return props.getTagRoleLabel(matched)
}

function isAlreadyApplied(tagName: string): boolean {
  return normalizedCurrentTagSet.value.has(tagName.trim().toLowerCase())
}

function applyProposedTag(tagName: string): void {
  if (props.disabled || isAlreadyApplied(tagName)) {
    return
  }
  emit('add', tagName)
}

function toggleControls(): void {
  controlsCollapsed.value = !controlsCollapsed.value
}

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
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3
          :id="aiHeadingId"
          class="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tf-color-text-default)]"
        >
          AI Proposed Tags
        </h3>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)]"
          :aria-controls="aiControlsId"
          :aria-expanded="!controlsCollapsed"
          @click="toggleControls"
        >
          {{ controlsCollapsed ? 'Show controls' : 'Hide controls' }}
        </button>

        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!imageId || disabled || isScanning"
          @click="runScan"
        >
          {{ isScanning ? 'Scanning…' : 'Scan now' }}
        </button>
      </div>
    </div>

    <div
      :id="aiControlsId"
      v-show="!controlsCollapsed"
      class="mt-3 grid gap-3 md:grid-cols-2"
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
          <p class="text-sm font-medium text-[var(--tf-color-text-default)]">Auto-scan on image change</p>
          <p class="text-xs text-[var(--tf-color-text-muted)]">{{ autoScanHelpText }}</p>
        </div>

        <AppSwitchField
          :model-value="autoScan"
          aria-label="Toggle auto scan"
          :disabled="disabled"
          @update:model-value="(value) => autoScan = value"
        />
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--tf-color-text-muted)]">
      <span>Threshold: {{ Math.round(confidenceThreshold * 100) }}%</span>
      <span>•</span>
      <span>Visible: {{ visibleProposedTags.length }}</span>
      <template v-if="!modelAvailable">
        <span>•</span>
        <span>Download progress: {{ downloadProgressPercent }}%</span>
      </template>
    </div>

    <div
      v-if="!modelAvailable"
      class="mt-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-alt)] px-3 py-2 text-xs text-[var(--tf-color-text-default)]"
    >
      <p class="font-medium">Selected model is not installed.</p>
      <p v-if="downloadMessage" class="mt-1">{{ downloadMessage }}</p>
      <p v-if="downloadProposalUrl" class="mt-1 break-all">
        Download source: <a :href="downloadProposalUrl" target="_blank" rel="noreferrer">{{ downloadProposalUrl }}</a>
      </p>
    </div>

    <div
      :id="aiListId"
      class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
      role="group"
      aria-label="AI proposed tags list"
      :aria-describedby="aiControlsId"
    >
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
        v-else-if="!visibleProposedTags.length"
        tone="muted"
      >
        No proposals above the selected threshold.
      </AppText>

      <TransitionGroup
        v-else
        name="proposal-list"
        tag="ul"
        class="grid list-none gap-2"
      >
        <TagActionRow
          v-for="tag in visibleProposedTags"
          :key="`${tag.name}-${tag.confidence}`"
          :label="tag.name"
          :meta="`${Math.round(tag.confidence * 100)}% confidence${roleLabelForName(tag.name) ? ` • ${roleLabelForName(tag.name)}` : ''}`"
          :variant="isAlreadyApplied(tag.name) ? 'selected' : 'default'"
          :action-label="isAlreadyApplied(tag.name) ? 'Selected' : 'Add'"
          :action-kind="isAlreadyApplied(tag.name) ? null : 'add'"
          :action-disabled="disabled || isAlreadyApplied(tag.name)"
          @action="applyProposedTag(tag.name)"
        />
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
.proposal-list-enter-active,
.proposal-list-leave-active {
  transition: all 0.16s ease;
}

.proposal-list-enter-from,
.proposal-list-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

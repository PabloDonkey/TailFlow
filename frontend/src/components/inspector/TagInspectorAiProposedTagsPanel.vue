<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ProjectTag, TaggingMode } from '../../api'
import AppNumberField from '../../design-system/AppNumberField.vue'
import AppSelectField from '../../design-system/AppSelectField.vue'
import AppSwitchField from '../../design-system/AppSwitchField.vue'
import AppText from '../ui/AppText.vue'
import TagInspectorTagRow from './TagInspectorTagRow.vue'

let aiInspectorRegionCounter = 0

interface ProposedTag {
  name: string
  confidence: number
}

const props = withDefaults(defineProps<{
  imageId: string | null
  mode: TaggingMode
  currentTags: ProjectTag[]
  disabled?: boolean
  maxDisplayedTags?: number
  getTagRoleLabel: (tag: ProjectTag) => string | null
}>(), {
  disabled: false,
  maxDisplayedTags: 16,
})

const emit = defineEmits<{
  add: [tagName: string]
}>()

const modelOptions = [
  { label: 'WD SwinV2', value: 'wd-swinv2' },
  { label: 'ConvNext v3', value: 'convnext-v3' },
  { label: 'SigLIP Hybrid', value: 'siglip-hybrid' },
] satisfies { label: string; value: string }[]

const mockPools: Record<TaggingMode, string[]> = {
  e621: [
    'masterpiece',
    'highres',
    'detailed background',
    'solo',
    'looking at viewer',
    'dynamic pose',
    'tail',
    'fur',
    'smile',
    'outdoors',
    'daylight',
    'sharp focus',
  ],
  booru: [
    'masterpiece',
    'best quality',
    '1girl',
    'long hair',
    'brown hair',
    'school uniform',
    'standing',
    'cityscape',
    'sunset',
    'dramatic lighting',
    'depth of field',
    'cinematic composition',
  ],
}

const selectedModel = ref(modelOptions[0]?.value ?? 'wd-swinv2')
const autoScan = ref(true)
const controlsCollapsed = ref(false)
const confidenceThreshold = ref(0.35)
const isScanning = ref(false)
const scanError = ref<string | null>(null)
const proposedTags = ref<ProposedTag[]>([])
const scanNonce = ref(0)
const aiRegionId = `ai-proposed-tags-region-${++aiInspectorRegionCounter}`
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
    .slice(0, props.maxDisplayedTags)
})

function hashSeed(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function pseudoRandom(seed: number): number {
  const next = (seed * 1664525 + 1013904223) >>> 0
  return next / 4294967296
}

function buildMockProposals(): ProposedTag[] {
  const pool = mockPools[props.mode]
  const seed = hashSeed(`${props.imageId ?? 'none'}:${props.mode}:${selectedModel.value}:${scanNonce.value}`)
  const generated = pool.map((name, index) => {
    const confidence = 0.2 + pseudoRandom(seed + index * 977) * 0.78
    return {
      name,
      confidence: Number(confidence.toFixed(2)),
    }
  })

  const deduped = new Map<string, ProposedTag>()
  for (const proposal of generated) {
    const normalized = proposal.name.toLowerCase()
    const existing = deduped.get(normalized)
    if (!existing || proposal.confidence > existing.confidence) {
      deduped.set(normalized, proposal)
    }
  }

  return [...deduped.values()]
}

async function runScan(): Promise<void> {
  if (!props.imageId || props.disabled) {
    proposedTags.value = []
    return
  }

  isScanning.value = true
  scanError.value = null
  scanNonce.value += 1

  try {
    await new Promise((resolve) => setTimeout(resolve, 260))
    proposedTags.value = buildMockProposals()
  } catch {
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
  [() => props.imageId, () => props.mode, selectedModel],
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
    class="flex h-full min-h-0 flex-col rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3"
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
          <p class="text-xs text-[var(--tf-color-text-muted)]">Keeps proposals in sync while browsing images.</p>
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
        Running mock scan…
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
        <TagInspectorTagRow
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

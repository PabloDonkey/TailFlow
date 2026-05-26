<script setup lang="ts">
import { computed, ref } from 'vue'

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
  canvasTitle?: string
  panelTitle: string
  panelOptions: PanelOption[]
  activePanelId: string
  currentPanelActions?: PanelAction[]
  rounded?: boolean
}>()

const emit = defineEmits<{
  'update:splitPercent': [value: number]
  'selectPanel': [panelId: string]
  'selectAction': [actionId: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const showPanelMenu = ref(false)

const clampedSplitPercent = computed(() => Math.max(0, Math.min(100, props.splitPercent)))

function updateSplitFromPointer(clientY: number): void {
  const container = containerRef.value
  if (!container) {
    return
  }

  const rect = container.getBoundingClientRect()
  if (rect.height <= 0) {
    return
  }

  const nextPercent = ((clientY - rect.top) / rect.height) * 100
  emit('update:splitPercent', Math.max(0, Math.min(100, nextPercent)))
}

function snapSplitValue(value: number): number {
  if (value <= 20) {
    return 0
  }
  if (value >= 80) {
    return 100
  }
  return value
}

function handlePointerDown(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }

  target.setPointerCapture(event.pointerId)
  updateSplitFromPointer(event.clientY)

  const onPointerMove = (moveEvent: PointerEvent) => {
    updateSplitFromPointer(moveEvent.clientY)
  }

  const onPointerUp = (upEvent: PointerEvent) => {
    target.releasePointerCapture(upEvent.pointerId)
    target.removeEventListener('pointermove', onPointerMove)
    target.removeEventListener('pointerup', onPointerUp)
    target.removeEventListener('pointercancel', onPointerUp)

    emit('update:splitPercent', snapSplitValue(clampedSplitPercent.value))
  }

  target.addEventListener('pointermove', onPointerMove)
  target.addEventListener('pointerup', onPointerUp)
  target.addEventListener('pointercancel', onPointerUp)
}

function selectPanel(panelId: string): void {
  emit('selectPanel', panelId)
  showPanelMenu.value = false
}

function selectAction(actionId: string): void {
  emit('selectAction', actionId)
  showPanelMenu.value = false
}
</script>

<template>
  <section
    ref="containerRef"
    class="relative h-full min-h-0"
  >
    <div
      class="h-full min-h-0 overflow-hidden border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)]"
      :class="props.rounded === false ? 'rounded-none' : 'rounded-[var(--tf-radius-lg)]'"
    >
      <div
        v-show="clampedSplitPercent > 0"
        class="min-h-0 overflow-hidden"
        :style="{ height: `${clampedSplitPercent}%` }"
      >
        <header class="flex items-center justify-between gap-2 border-b border-[var(--tf-color-surface-border)] px-3 py-2">
          <h2 class="m-0 text-sm font-semibold text-[var(--tf-color-text-default)]">
            {{ canvasTitle ?? 'Image Canvas' }}
          </h2>

          <slot name="canvas-header-actions" />
        </header>

        <div class="h-[calc(100%-2.5rem)] min-h-0 overflow-y-auto p-3">
          <slot name="canvas" />
        </div>
      </div>

      <div
        v-show="clampedSplitPercent < 100"
        class="min-h-0 overflow-hidden border-t border-[var(--tf-color-surface-border)]"
        :style="{ height: `${100 - clampedSplitPercent}%` }"
      >
        <header class="relative flex items-center justify-between border-b border-[var(--tf-color-surface-border)] px-3 py-2">
          <h2 class="m-0 text-sm font-semibold text-[var(--tf-color-text-default)]">
            {{ panelTitle }}
          </h2>

          <div class="flex items-center gap-2">
            <slot name="header-actions" />

            <div class="relative">
              <button
                data-testid="mobile-panel-menu-button"
                type="button"
                class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
                aria-label="Open mobile panel menu"
                @click="showPanelMenu = !showPanelMenu"
              >
                [...]
              </button>

              <div
                v-if="showPanelMenu"
                data-testid="mobile-panel-menu"
                class="absolute right-0 top-[calc(100%+0.25rem)] z-20 flex min-w-44 flex-col gap-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1 shadow-md"
              >
                <template v-if="currentPanelActions?.length">
                  <p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
                    Current Panel
                  </p>

                  <button
                    v-for="action in currentPanelActions"
                    :key="action.id"
                    type="button"
                    class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)]"
                    @click="selectAction(action.id)"
                  >
                    {{ action.label }}
                  </button>

                  <hr class="my-1 border-[var(--tf-color-surface-border)]">
                </template>

                <p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
                  Navigate
                </p>

                <button
                  v-for="panel in panelOptions"
                  :key="panel.id"
                  type="button"
                  class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs"
                  :class="panel.id === activePanelId ? 'bg-[var(--tf-color-surface-alt)] text-[var(--tf-color-text-default)]' : 'text-[var(--tf-color-text-muted)] hover:bg-[var(--tf-color-surface-alt)]'"
                  @click="selectPanel(panel.id)"
                >
                  {{ panel.label }}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div class="h-[calc(100%-2.5rem)] min-h-0 overflow-y-auto p-3">
          <slot name="panel" />
        </div>
      </div>
    </div>

    <button
      type="button"
      data-testid="mobile-workspace-splitter"
      class="absolute left-0 z-10 h-5 w-full touch-none cursor-row-resize"
      :style="{ top: `calc(${clampedSplitPercent}% - 0.625rem)` }"
      aria-label="Resize mobile workspace panels"
      @pointerdown="handlePointerDown"
    >
      <span class="mx-auto mt-1 block h-1.5 w-14 rounded-full bg-[var(--tf-color-surface-border)]" />
    </button>
  </section>
</template>

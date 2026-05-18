<script setup lang="ts">
import AppSplitterGroup from '../../design-system/AppSplitterGroup.vue'
import AppSplitterPanel from '../../design-system/AppSplitterPanel.vue'
import AppSplitterResizeHandle from '../../design-system/AppSplitterResizeHandle.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  showLeft?: boolean
  showRight?: boolean
}>(), {
  showLeft: true,
  showRight: true,
})

const sidePanelClass =
  'h-full min-h-0 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-y-auto'
const centerPanelClass =
  'h-full min-h-0 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 overflow-hidden lg:h-full lg:min-h-0 lg:overflow-hidden'

const horizontalLayoutAutoSaveId = computed(() => {
  if (props.showLeft && props.showRight) {
    return 'workspace-tagging-layout-left-center-right'
  }
  if (props.showLeft) {
    return 'workspace-tagging-layout-left-center'
  }
  if (props.showRight) {
    return 'workspace-tagging-layout-center-right'
  }
  return 'workspace-tagging-layout-center-only'
})

const isDesktopViewport = ref(false)

function updateViewportState() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isDesktopViewport.value = true
    return
  }
  isDesktopViewport.value = window.matchMedia('(min-width: 1024px)').matches
}

onMounted(() => {
  updateViewportState()
  window.addEventListener('resize', updateViewportState)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateViewportState)
  }
})
</script>

<template>
  <section class="h-full min-h-0 lg:h-full">
    <div
      v-if="!isDesktopViewport"
      class="grid min-h-0 grid-cols-1 gap-3"
    >
      <section :class="centerPanelClass">
        <slot />
      </section>

      <aside
        aria-hidden="true"
        :class="`${sidePanelClass} hidden`"
      />
      <aside
        aria-hidden="true"
        :class="`${sidePanelClass} hidden`"
      />
    </div>

    <AppSplitterGroup
      v-else
      :auto-save-id="horizontalLayoutAutoSaveId"
      class="h-full min-h-0 w-full"
      direction="horizontal"
    >
      <AppSplitterPanel
        v-if="showLeft"
        id="workspace-left-panel"
        :order="1"
        :default-size="25"
        :max-size="35"
        :min-size="18"
        class="min-h-0"
      >
        <aside :class="sidePanelClass">
          <slot name="left" />
        </aside>
      </AppSplitterPanel>

      <AppSplitterResizeHandle
        v-if="showLeft"
        class="mx-1 my-1 w-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
      />

      <AppSplitterPanel
        id="workspace-center-panel"
        :order="2"
        :default-size="showLeft && showRight ? 50 : 72"
        :min-size="30"
        class="min-h-0"
      >
        <section :class="centerPanelClass">
          <slot />
        </section>
      </AppSplitterPanel>

      <AppSplitterResizeHandle
        v-if="showRight"
        class="mx-1 my-1 w-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
      />

      <AppSplitterPanel
        v-if="showRight"
        id="workspace-right-panel"
        :order="3"
        :default-size="25"
        :max-size="35"
        :min-size="18"
        class="min-h-0"
      >
        <aside :class="sidePanelClass">
          <slot name="right" />
        </aside>
      </AppSplitterPanel>
    </AppSplitterGroup>
  </section>
</template>

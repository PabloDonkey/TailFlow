<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { onMounted, onUnmounted, ref } from 'vue'

const sidePanelClass =
  'h-full min-h-0 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-y-auto'
const centerPanelClass =
  'h-full min-h-0 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 overflow-hidden lg:h-full lg:min-h-0 lg:overflow-hidden'

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

    <SplitterGroup
      v-else
      auto-save-id="workspace-tagging-layout"
      class="h-full min-h-0 w-full"
      direction="horizontal"
    >
      <SplitterPanel
        :default-size="25"
        :max-size="35"
        :min-size="18"
        class="min-h-0"
      >
        <aside :class="sidePanelClass">
          <slot name="left" />
        </aside>
      </SplitterPanel>

      <SplitterResizeHandle
        class="mx-1 my-1 w-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
      />

      <SplitterPanel
        :default-size="50"
        :min-size="30"
        class="min-h-0"
      >
        <section :class="centerPanelClass">
          <slot />
        </section>
      </SplitterPanel>

      <SplitterResizeHandle
        class="mx-1 my-1 w-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
      />

      <SplitterPanel
        :default-size="25"
        :max-size="35"
        :min-size="18"
        class="min-h-0"
      >
        <aside :class="sidePanelClass">
          <slot name="right" />
        </aside>
      </SplitterPanel>
    </SplitterGroup>
  </section>
</template>

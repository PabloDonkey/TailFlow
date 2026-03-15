<script setup lang="ts">
const sidePanelClass =
  'hidden rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto'
const centerPanelClass =
  'rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:h-full lg:min-h-0 lg:overflow-hidden'
</script>

<template>
  <section class="grid min-h-0 grid-cols-1 gap-3 lg:h-full lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)_minmax(260px,340px)] lg:items-stretch">
    <aside :class="sidePanelClass">
      <slot name="left" />
    </aside>

    <section :class="centerPanelClass">
      <slot />
    </section>

    <aside :class="sidePanelClass">
      <slot name="right" />
    </aside>
  </section>
</template>

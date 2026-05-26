<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import AppToastProvider from '../../design-system/AppToastProvider.vue'
import AppToastRoot from '../../design-system/AppToastRoot.vue'
import AppToastTitle from '../../design-system/AppToastTitle.vue'
import AppToastViewport from '../../design-system/AppToastViewport.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <AppToastProvider>
    <AppToastViewport
      class="fixed bottom-3 right-3 z-[120] flex w-[min(26rem,calc(100vw-1.5rem))] max-w-full list-none flex-col gap-2 p-0 outline-none"
    />

    <AppToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :duration="toast.duration"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2 text-sm text-[var(--tf-color-text-default)] shadow-lg data-[state=closed]:animate-[fadeOut_140ms_ease-in] data-[state=open]:animate-[fadeIn_140ms_ease-out]"
      @update:open="(open: boolean) => {
        if (!open) {
          removeToast(toast.id)
        }
      }"
    >
      <AppToastTitle>{{ toast.message }}</AppToastTitle>
    </AppToastRoot>
  </AppToastProvider>
</template>

<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
}>()
</script>

<template>
  <AlertDialogRoot
    :open="props.open"
    @update:open="(open) => emit('update:open', open)"
  >
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-[140] bg-black/45"
      />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-[141] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-4 shadow-lg"
      >
        <AlertDialogTitle class="text-sm font-semibold text-[var(--tf-color-text-default)]">
          {{ props.title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm text-[var(--tf-color-text-muted)]">
          {{ props.description }}
        </AlertDialogDescription>
        <div class="mt-4 flex justify-end gap-2">
          <AlertDialogCancel
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--tf-color-text-default)]"
          >
            {{ props.cancelLabel }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-danger)] bg-[var(--tf-color-danger)] px-3 py-1.5 text-xs font-medium text-white"
            @click="emit('confirm')"
          >
            {{ props.confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
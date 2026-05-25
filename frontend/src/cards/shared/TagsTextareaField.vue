<script setup lang="ts">
import AppTagsInputInput from '../../design-system/AppTagsInputInput.vue'
import AppTagsInputItem from '../../design-system/AppTagsInputItem.vue'
import AppTagsInputItemText from '../../design-system/AppTagsInputItemText.vue'
import AppTagsInputRoot from '../../design-system/AppTagsInputRoot.vue'
import { computed } from 'vue'

interface TagsTextareaFieldItem {
  key: string
  label: string
  metaInline?: string | null
  meta?: string | null
  variant?: 'default' | 'selected'
  actionIcon?: string | null
  actionAriaLabel?: string | null
  actionDisabled?: boolean
}

const props = withDefaults(defineProps<{
  items: TagsTextareaFieldItem[]
  placeholder?: string
  disabled?: boolean
  clickToAction?: boolean
}>(), {
  placeholder: 'Tags... ',
  disabled: false,
  clickToAction: false,
})

const emit = defineEmits<{
  action: [itemKey: string]
}>()

const itemValues = computed(() => props.items.map((item) => item.key))

function handleAction(item: TagsTextareaFieldItem): void {
  if (item.actionDisabled || item.actionIcon === 'lock') {
    return
  }
  emit('action', item.key)
}

function onChipClick(item: TagsTextareaFieldItem): void {
  if (!props.clickToAction) {
    return
  }
  handleAction(item)
}

function onChipKeydown(event: KeyboardEvent, item: TagsTextareaFieldItem): void {
  if (!props.clickToAction) {
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleAction(item)
  }
}
</script>

<template>
  <AppTagsInputRoot
    :model-value="itemValues"
    class="flex h-full w-full flex-wrap content-start items-start gap-2 overflow-x-hidden overflow-y-auto rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2"
    :disabled="disabled"
  >
    <AppTagsInputItem
      v-for="item in items"
      :key="item.key"
      :value="item.key"
      :title="item.meta ?? undefined"
      data-testid="tag-chip"
      class="inline-flex max-w-full items-center gap-1 rounded-[8px] border px-2 py-1 text-xs font-medium"
      :class="[
        item.variant === 'selected'
          ? 'border-[rgb(101_186_116)] bg-[rgb(101_186_116)] text-white'
          : 'border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-alt)] text-[var(--tf-color-text-default)]',
        clickToAction && !item.actionDisabled ? 'cursor-pointer' : '',
      ]"
      :role="clickToAction && !item.actionDisabled ? 'button' : undefined"
      :aria-label="clickToAction && !item.actionDisabled ? (item.actionAriaLabel ?? `Toggle tag ${item.label}`) : undefined"
      :aria-disabled="clickToAction && item.actionDisabled ? 'true' : undefined"
      :tabindex="clickToAction && !item.actionDisabled ? 0 : undefined"
      @click="onChipClick(item)"
      @keydown="onChipKeydown($event, item)"
    >
      <AppTagsInputItemText class="max-w-[12rem] truncate">
        {{ item.label }}
      </AppTagsInputItemText>

      <span
        v-if="item.metaInline"
        class="text-[11px]"
        :class="item.variant === 'selected' ? 'text-white/90' : 'text-[var(--tf-color-text-muted)]'"
      >
        | {{ item.metaInline }}
      </span>

      <span
        v-if="item.actionIcon === 'lock'"
        class="text-[11px] leading-none"
        :class="item.variant === 'selected' ? 'text-white' : 'text-[var(--tf-color-text-muted)]'"
        aria-hidden="true"
      >
        🔒
      </span>

      <button
        v-else-if="item.actionIcon"
        type="button"
        class="text-[11px] leading-none transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        :class="item.variant === 'selected' ? 'text-white' : 'text-[var(--tf-color-text-muted)]'"
        :aria-label="item.actionAriaLabel ?? undefined"
        :disabled="item.actionDisabled"
        @click="handleAction(item)"
      >
        {{ item.actionIcon }}
      </button>
    </AppTagsInputItem>

    <AppTagsInputInput
      :placeholder="placeholder"
      class="min-w-[8rem] grow basis-[10rem] bg-transparent py-1 text-sm text-[var(--tf-color-text-default)] outline-none placeholder:text-[var(--tf-color-text-muted)]"
      :disabled="disabled"
    />
  </AppTagsInputRoot>
</template>

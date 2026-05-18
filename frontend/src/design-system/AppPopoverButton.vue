<script setup lang="ts">
import {
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
} from 'reka-ui'

interface AppPopoverButtonProps {
  readonly open: boolean
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly align?: 'start' | 'center' | 'end'
  readonly sideOffset?: number
  readonly contentClass?: string
  readonly contentTestId?: string
}

const props = withDefaults(defineProps<AppPopoverButtonProps>(), {
  side: 'bottom',
  align: 'center',
  sideOffset: 4,
  contentClass: '',
  contentTestId: undefined,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()
</script>

<template>
  <PopoverRoot
    :open="props.open"
    @update:open="(open) => emit('update:open', open)"
  >
    <PopoverAnchor as-child>
      <slot name="anchor" />
    </PopoverAnchor>

    <PopoverPortal>
      <PopoverContent
        :side="props.side"
        :align="props.align"
        :side-offset="props.sideOffset"
        :data-testid="props.contentTestId"
        :class="props.contentClass"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { Motion } from 'motion-v'

export type SwipeHintDirection = 'left' | 'right'

const props = defineProps<{
  /** Minimum horizontal distance in px to recognise a swipe. Default: 80 */
  minDistance?: number
  /** Called when a left swipe is detected (next image) */
  onSwipeLeft?: () => void
  /** Called when a right swipe is detected (previous image) */
  onSwipeRight?: () => void
}>()

const emit = defineEmits<{
  (e: 'swipe-left'): void
  (e: 'swipe-right'): void
}>()

const swipeHint = ref<SwipeHintDirection | null>(null)
const dragIndicator = ref<SwipeHintDirection | null>(null)
let hintTimer: ReturnType<typeof setTimeout> | null = null
let touchStartX = 0
let touchStartY = 0
let lastSwipeAt = 0

const INDICATOR_ACTIVATE_PX = 18
const MAX_SWIPE_ANGLE_DEG = 25
const activeIndicator = computed(() => dragIndicator.value ?? swipeHint.value)

type PanInfo = {
  offset: {
    x: number
    y: number
  }
  velocity?: {
    x?: number
    y?: number
  }
}

const motionPanHandlers = {
  onPanStart: handlePanStart,
  onPan: handlePan,
  onPanEnd: handlePanEnd,
}

function isHorizontalEnough(dx: number, dy: number): boolean {
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  if (absDx <= 0) {
    return false
  }

  const angleRad = Math.atan2(absDy, absDx)
  const maxAngleRad = (MAX_SWIPE_ANGLE_DEG * Math.PI) / 180
  return angleRad <= maxAngleRad
}

function updateDragIndicator(dx: number, dy: number): void {
  const absDx = Math.abs(dx)
  if (!isHorizontalEnough(dx, dy)) {
    dragIndicator.value = null
    return
  }

  if (absDx >= INDICATOR_ACTIVATE_PX) {
    dragIndicator.value = dx < 0 ? 'left' : 'right'
  }
}

function triggerSwipe(direction: SwipeHintDirection): void {
  const now = Date.now()
  if (now - lastSwipeAt < 250) {
    return
  }
  lastSwipeAt = now

  if (direction === 'left') {
    emit('swipe-left')
    props.onSwipeLeft?.()
    showHint('left')
    return
  }

  emit('swipe-right')
  props.onSwipeRight?.()
  showHint('right')
}

function showHint(direction: SwipeHintDirection): void {
  swipeHint.value = direction
  if (hintTimer !== null) {
    clearTimeout(hintTimer)
  }
  hintTimer = setTimeout(() => {
    swipeHint.value = null
  }, 500)
}

function handlePanStart(): void {
  dragIndicator.value = null
}

function handlePan(_: PointerEvent, info: PanInfo): void {
  updateDragIndicator(info.offset.x, info.offset.y)
}

function handlePanEnd(_: PointerEvent, info: PanInfo): void {
  const minDistance = props.minDistance ?? 80
  const dx = info.offset.x
  const dy = info.offset.y
  const absDx = Math.abs(dx)

  dragIndicator.value = null

  if (!isHorizontalEnough(dx, dy)) return
  if (absDx < minDistance) return

  triggerSwipe(dx < 0 ? 'left' : 'right')
}

function handleTouchStart(event: TouchEvent): void {
  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  touchStartX = touch.clientX
  touchStartY = touch.clientY
  dragIndicator.value = null
}

function handleTouchMove(event: TouchEvent): void {
  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  updateDragIndicator(dx, dy)
}

function handleTouchEnd(event: TouchEvent): void {
  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const minDistance = props.minDistance ?? 80
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  const absDx = Math.abs(dx)

  dragIndicator.value = null

  if (!isHorizontalEnough(dx, dy)) return
  if (absDx < minDistance) return

  triggerSwipe(dx < 0 ? 'left' : 'right')
}

function handleTouchCancel(): void {
  dragIndicator.value = null
}

watchEffect(() => {
  return () => {
    if (hintTimer !== null) {
      clearTimeout(hintTimer)
    }
  }
})
</script>

<template>
  <Motion
    tag="div"
    class="relative h-full min-h-0"
    style="touch-action: pan-y;"
    v-bind="motionPanHandlers"
    @touchstart.capture.passive="handleTouchStart"
    @touchmove.capture.passive="handleTouchMove"
    @touchend.capture.passive="handleTouchEnd"
    @touchcancel.capture.passive="handleTouchCancel"
  >
    <slot />
    <Transition name="swipe-hint">
      <div
        v-if="activeIndicator !== null"
        class="pointer-events-none absolute inset-0 z-10 flex items-center"
        :class="activeIndicator === 'left' ? 'justify-end pr-5' : 'justify-start pl-5'"
        aria-hidden="true"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white">
          <!-- Chevron right when swiping left (next image) -->
          <svg
            v-if="activeIndicator === 'left'"
            viewBox="0 0 24 24"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <!-- Chevron left when swiping right (previous image) -->
          <svg
            v-else
            viewBox="0 0 24 24"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </div>
    </Transition>
  </Motion>
</template>

<style scoped>
.swipe-hint-enter-active {
  transition: opacity 0.15s ease;
}

.swipe-hint-leave-active {
  transition: opacity 0.35s ease;
}

.swipe-hint-enter-from,
.swipe-hint-leave-to {
  opacity: 0;
}
</style>

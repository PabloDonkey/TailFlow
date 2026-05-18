import { onMounted, onUnmounted, ref } from 'vue'

export function useWorkspaceViewport() {
  const isMobileViewportRef = ref(false)

  function isMobileViewport(): boolean {
    return isMobileViewportRef.value
  }

  function updateMobileViewportState() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      isMobileViewportRef.value = false
      return
    }

    isMobileViewportRef.value = window.matchMedia('(max-width: 1023px)').matches
  }

  onMounted(() => {
    updateMobileViewportState()
    window.addEventListener('resize', updateMobileViewportState)
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateMobileViewportState)
    }
  })

  return {
    isMobileViewportRef,
    isMobileViewport,
  }
}

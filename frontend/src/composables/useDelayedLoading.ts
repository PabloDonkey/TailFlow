import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useDelayedLoading(loading: Ref<boolean>, delayMs = 200) {
  const showLoading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(
    loading,
    (isLoading) => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      if (isLoading) {
        timer = setTimeout(() => {
          showLoading.value = true
          timer = null
        }, delayMs)
        return
      }

      showLoading.value = false
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  })

  return showLoading
}

import { ref } from 'vue'

export type AppToast = {
  id: string
  message: string
  duration: number
}

const toasts = ref<AppToast[]>([])
let toastCounter = 0

export function useToast() {
  function showToast(message: string, duration = 2200): string {
    toastCounter += 1
    const id = `toast-${toastCounter}`
    toasts.value = [...toasts.value, { id, message, duration }]
    return id
  }

  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast,
  }
}

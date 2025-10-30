// ============================================================================
// Frontend: Add useToast.js
// FILE: src/composables/useToast.js (NEW FILE - JS Version)
// REASON: Provides toast notifications. Converted to JS for project consistency.
// ============================================================================
import { useToast as useVueToast } from 'vue-toastification'

/**
 * Custom composable for showing toasts.
 * Provides sensible defaults and simple success/error/info methods.
 */
export function useToast() {
    const toast = useVueToast()

    const toastOptions = (timeout = 5000) => ({
        position: 'top-right',
        timeout,
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        showCloseButtonOnHover: false,
        hideProgressBar: false,
        closeButton: 'button',
        icon: true,
        rtl: false
    })

    const success = (message, timeout = 5000) => {
        toast.success(message, toastOptions(timeout))
    }

    const error = (message, timeout = 10000) => {
        toast.error(message, toastOptions(timeout))
    }

    const info = (message, timeout = 3000) => {
        toast.info(message, toastOptions(timeout))
    }

    const warn = (message, timeout = 5000) => {
        toast.warning(message, toastOptions(timeout))
    }

    return {
        success,
        error,
        info,
        warn
    }
}
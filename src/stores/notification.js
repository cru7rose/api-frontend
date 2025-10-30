// ============================================================================
// Frontend: Add notification.js store
// FILE: src/stores/notification.js (NEW FILE)
// REASON: This file was implicitly required by the new App.vue layout
//         to manage the global notification banner.
// ============================================================================
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
    const isVisible = ref(false);
    const message = ref('');
    const type = ref('info'); // 'info', 'success', 'error'
    let timer = null;

    function show(msg, msgType = 'info', duration = 5000) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        message.value = msg;
        type.value = msgType;
        isVisible.value = true;

        if (duration > 0) {
            timer = setTimeout(() => {
                hide();
            }, duration);
        }
    }

    function hide() {
        isVisible.value = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    return {
        isVisible,
        message,
        type,
        show,
        hide,
    };
});
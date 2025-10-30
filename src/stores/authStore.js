// ============================================================================
// Frontend: Compatibility re-export for legacy imports
// FILE: src/stores/authStore.js
// REASON: Prevent duplicate Pinia store definitions. Keep all existing imports
//         working by re-exporting the canonical store from auth.js.
// ============================================================================
export { useAuthStore } from './auth.js';

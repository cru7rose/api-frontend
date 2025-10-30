// ============================================================================
// stores/authStore.js — Compatibility shim
// Any legacy imports using '@/stores/authStore' will resolve to the canonical
// store from '@/stores/auth' to prevent "two stores" divergence.
// ============================================================================
export * from "./auth.js";

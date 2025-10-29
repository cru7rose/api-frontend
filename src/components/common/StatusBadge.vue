<script setup>
import { computed } from 'vue';
import { StatusBadgeViewModel } from '@/viewmodels/StatusBadgeViewModel';

const props = defineProps({
  status: {
    type: String,
    default: 'UNKNOWN'
  }
});

const badge = computed(() => {
  return new StatusBadgeViewModel(props.status).toObject();
});
</script>

<template>
  <span class="badge" :class="badge.tone">
    {{ badge.label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit));
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tones based on theme.css variables */
.badge.success {
  background-color: var(--color-success);
  color: #fff;
}
.badge.warning {
  background-color: var(--color-warning);
  color: var(--color-text); /* Yellow needs dark text */
}
.badge.danger {
  background-color: var(--color-danger);
  color: #fff;
}
.badge.info {
  background-color: var(--color-info);
  color: #fff;
}
.badge.neutral {
  background-color: var(--color-neutral);
  color: #fff;
}
.badge.unknown {
  background-color: var(--color-border);
  color: var(--color-text-light);
}
</style>
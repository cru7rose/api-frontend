<template>
  <div class="admin-view-container">
    <h2>AED (MG) SFTP Export</h2>
    <p>
      Manually trigger an export of 'MG' customer statuses to the AED SFTP server.
    </p>
    <p class="warning-text">
      <strong>Warning:</strong> This queries all 'MG' statuses recorded after the
      specified start time, regardless of whether they were previously exported.
      Use this only if you suspect statuses were missed by the automated process.
    </p>

    <div class="export-controls">
      <div class="form-group">
        <label for="start-time">Export Statuses From (Local Time):</label>
        <input
            id="start-time"
            type="datetime-local"
            v-model="store.startTime"
            :disabled="store.isLoading"
        />
      </div>

      <button @click="handleTriggerExport" :disabled="store.isLoading || !store.startTime">
        {{ store.isLoading ? 'Exporting...' : 'Trigger Manual Export' }}
      </button>
    </div>

    <div v-if="store.isLoading" class="feedback-message loading">
      Processing request...
    </div>
    <div v-if="store.error" class="feedback-message error">
      <strong>Error:</strong> {{ store.error }}
    </div>
    <div v-if="store.successMessage" class="feedback-message success">
      <strong>Success:</strong> {{ store.successMessage }}
    </div>
  </div>
</template>

<script setup>
import { useAedSftpStore } from '@/stores/useAedSftpStore';
import { onMounted } from 'vue';

const store = useAedSftpStore();

// Clear old messages on component mount
onMounted(() => {
  store.error = null;
  store.successMessage = null;
  store.lastExportCount = 0;
});

const handleTriggerExport = () => {
  if (confirm(`Are you sure you want to export all 'MG' statuses since ${store.startTime}?`)) {
    store.triggerManualExport();
  }
};
</script>

<style scoped>
.admin-view-container {
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

h2 {
  border-bottom: 2px solid #004a99; /* DANXILS blue */
  padding-bottom: 0.5rem;
  color: #004a99;
}

.warning-text {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  padding: 1rem;
  border-radius: 4px;
  color: #a0522d;
}

.export-controls {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: bold;
  font-size: 0.9rem;
}

input[type="datetime-local"] {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  background-color: #004a99; /* DANXILS blue */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #003366; /* Darker blue */
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.feedback-message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.loading {
  background-color: #e6f7ff;
  border-color: #b3e0ff;
  color: #0056b3;
}

.error {
  background-color: #fff1f0;
  border-color: #ffccc7;
  color: #d9363e;
}

.success {
  background-color: #f6ffed;
  border-color: #d9f7be;
  color: #389e0d;
}
</style>
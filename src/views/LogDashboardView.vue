// FILE: src/views/LogDashboardView.vue
// NEW FILE
<template>
  <div class="log-dashboard">
    <h1>Application Logs</h1>

    <div class="filters">
      <input type="text" v-model="logStore.queryFilter" placeholder="Search query..." @keyup.enter="applyFilters"/>
      <input type="text" v-model="logStore.correlationIdFilter" placeholder="Correlation ID..." @keyup.enter="applyFilters"/>
      <select v-model="logStore.appNameFilter" @change="applyFilters">
        <option value="">All Apps</option>
        <option value="danxils-api">DANXILS-API</option>
        <option value="tes">TES</option>
        <option value="frontend">Frontend</option>
      </select>
      <select v-model="logStore.levelFilter" @change="applyFilters">
        <option value="">All Levels</option>
        <option value="ERROR">ERROR</option>
        <option value="WARN">WARN</option>
        <option value="INFO">INFO</option>
        <option value="DEBUG">DEBUG</option>
        <option value="TRACE">TRACE</option>
      </select>
      <button @click="applyFilters" :disabled="logStore.loading">Search</button>
    </div>

    <div v-if="logStore.loading" class="loading">Loading logs...</div>
    <div v-if="logStore.error" class="error-message">Error: {{ logStore.error }}</div>

    <div v-if="!logStore.loading && logStore.logs.length === 0 && !logStore.error" class="no-results">
      No log entries found for the current filters. (Note: Log aggregation infrastructure must be configured.)
    </div>

    <div v-if="logStore.logs.length > 0" class="log-entries">
      <table>
        <thead>
        <tr>
          <th>Timestamp</th>
          <th>Level</th>
          <th>App</th>
          <th>Correlation ID</th>
          <th>Message</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(log, index) in logStore.logs" :key="index" :class="`level-${log.level?.toLowerCase()}`">
          <td>{{ formatTimestamp(log['@timestamp'] || log.timestamp) }}</td>
          <td>{{ log.level || log.log?.level }}</td>
          <td>{{ log.appName || log.service?.name || '?' }}</td>
          <td>{{ log.correlationId || log.trace?.id || '?' }}</td>
          <td class="message">{{ log.message }}</td>
        </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button @click="prevPage" :disabled="logStore.currentPage === 0 || logStore.loading">Previous</button>
        <span>Page {{ logStore.currentPage + 1 }} of {{ logStore.totalPages }}</span>
        <button @click="nextPage" :disabled="logStore.currentPage >= logStore.totalPages - 1 || logStore.loading">Next</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useLogStore } from '@/stores/useLogStore';

const logStore = useLogStore();

onMounted(() => {
  logStore.fetchLogs(); // Initial fetch
});

const applyFilters = () => {
  logStore.applyFiltersAndFetch();
};

const prevPage = () => {
  logStore.setPage(logStore.currentPage - 1);
};

const nextPage = () => {
  logStore.setPage(logStore.currentPage + 1);
};

// Basic timestamp formatter (adjust as needed)
const formatTimestamp = (ts) => {
  if (!ts) return '-';
  try {
    // Attempt to parse ISO string or epoch millis
    const date = new Date(isNaN(ts) ? ts : Number(ts));
    return date.toLocaleString(); // Use locale-specific format
  } catch (e) {
    return ts; // Return original if parsing fails
  }
};
</script>

<style scoped>
.log-dashboard {
  padding: 20px;
  font-family: sans-serif;
}

.filters {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.filters input, .filters select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.filters button {
  padding: 8px 15px;
  cursor: pointer;
}

.loading, .error-message, .no-results {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}
.loading { background-color: #e0e0e0; }
.error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.no-results { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

.log-entries table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 0.9em;
}
.log-entries th, .log-entries td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}
.log-entries th {
  background-color: #f2f2f2;
}
.log-entries td.message {
  white-space: pre-wrap; /* Preserve whitespace/newlines */
  word-break: break-all; /* Wrap long lines */
}

/* Optional: Color coding based on level */
.level-error { background-color: #f8d7da; }
.level-warn { background-color: #fff3cd; }

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}
.pagination button {
  padding: 5px 10px;
}
</style>
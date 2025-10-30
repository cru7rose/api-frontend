<template>
  <div class="log-dashboard bg-white">
    <h1 class="text-xl font-semibold text-slate-900 mb-4">System Logs</h1>

    <!-- Filters -->
    <div class="filters">
      <input type="text" placeholder="Search message…" v-model="logStore.filters.query" @keyup.enter="applyFilters" />
      <select v-model="logStore.filters.level">
        <option value="">All Levels</option>
        <option value="ERROR">ERROR</option>
        <option value="WARN">WARN</option>
        <option value="INFO">INFO</option>
        <option value="DEBUG">DEBUG</option>
      </select>
      <input type="datetime-local" v-model="logStore.filters.from" />
      <input type="datetime-local" v-model="logStore.filters.to" />
      <button @click="applyFilters" :disabled="logStore.loading">Apply</button>
    </div>

    <div v-if="logStore.loading" class="loading">Loading…</div>
    <div v-else-if="logStore.error" class="error-message">{{ logStore.error }}</div>
    <div v-else-if="!logStore.entries.length" class="no-results">No results.</div>

    <!-- Table -->
    <div v-else class="log-entries">
      <table>
        <thead>
        <tr>
          <th style="width: 12rem;">Timestamp</th>
          <th style="width: 5rem;">Level</th>
          <th>Logger</th>
          <th>Message</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(e, idx) in logStore.entries" :key="idx" :class="rowClass(e)">
          <td>{{ formatTimestamp(e.timestamp) }}</td>
          <td>{{ e.level }}</td>
          <td>{{ e.logger || '-' }}</td>
          <td class="message">{{ e.message }}</td>
        </tr>
        </tbody>
      </table>

      <!-- Pager -->
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
  logStore.fetchLogs();
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

const formatTimestamp = (ts) => {
  if (!ts) return '-';
  try {
    const date = new Date(isNaN(ts) ? ts : Number(ts));
    return date.toLocaleString();
  } catch {
    return ts;
  }
};

const rowClass = (e) => ({
  'level-error': e.level === 'ERROR',
  'level-warn': e.level === 'WARN',
});
</script>

<style scoped>
.log-dashboard { padding: 20px; }
.filters { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
.filters input, .filters select { padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
.filters button { padding: 8px 15px; cursor: pointer; border-radius: 10px; background: #facc15; border: 1px solid #eab308; color: #0b1220; }

.loading, .error-message, .no-results { margin-top: 20px; padding: 15px; border-radius: 8px; }
.loading { background-color: #e0e0e0; }
.error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.no-results { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

.log-entries table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9em; }
.log-entries th, .log-entries td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
.log-entries th { background-color: #f2f2f2; }
.log-entries td.message { white-space: pre-wrap; word-break: break-word; }

.level-error { background-color: #fef2f2; }
.level-warn { background-color: #fffbeb; }

.pagination { margin-top: 20px; display: flex; justify-content: center; align-items: center; gap: 15px; }
.pagination button { padding: 6px 12px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; }
</style>

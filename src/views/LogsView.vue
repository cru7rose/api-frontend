<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader title="Aggregated System Logs" subtitle="View logs from all connected services." />

    <div class="mt-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormInput id="filter-query" label="Search Query" v-model="filters.query" @keyup.enter="applyFilters" />
        <FormInput id="filter-correlationId" label="Correlation ID" v-model="filters.correlationId" @keyup.enter="applyFilters" />
        <FormInput id="filter-appName" label="App Name" v-model="filters.appName" @keyup.enter="applyFilters" />
        <FormInput id="filter-level" label="Level (e.g., WARN)" v-model="filters.level" @keyup.enter="applyFilters" />
      </div>
      <div class="mt-4 flex justify-end">
        <button
            @click="applyFilters"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Search
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-8 text-center">
      <p>Loading logs...</p>
    </div>
    <div v-if="error" class="mt-8 text-center text-red-500">
      <p>Failed to load logs: {{ error }}</p>
    </div>

    <div v-if="!loading && pageData" class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6">Time</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">App</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Lvl</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Message</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Correlation ID</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <tr v-if="pageData.empty">
                <td colspan="5" class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">No logs found matching your criteria.</td>
              </tr>
              <tr v-for="(log, index) in pageData.content" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 sm:pl-6">{{ formatTimestamp(log['@timestamp']) }}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                        class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        :class_name="getAppColor(log.app_name)"
                    >
                      {{ log.app_name || 'unknown' }}
                    </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                  <span :class_name="getLevelColor(log.level)">{{ log.level }}</span>
                </td>
                <td class="px-3 py-4 text-sm text-gray-800 dark:text-gray-200" style="word-break: break-word; max-width: 600px;">{{ log.message }}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">{{ log.correlationId }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Pagination
          v-if="!pageData.empty"
          :current-page="pageData.number + 1"
          :total-pages="pageData.totalPages"
          :total-items="pageData.totalElements"
          :per-page="pageData.size"
          @page-changed="goToPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogService } from '@/services/LogService.js';
import PageHeader from '@/components/PageHeader.vue';
import FormInput from '@/components/FormInput.vue';
import Pagination from '@/components/Pagination.vue';
import { format, parseISO } from 'date-fns';

const logService = new LogService();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const pageData = ref(null);

const filters = reactive({
  query: route.query.query || '',
  correlationId: route.query.correlationId || '',
  appName: route.query.appName || '',
  level: route.query.level || '',
});

const pageable = reactive({
  page: route.query.page ? parseInt(route.query.page, 10) - 1 : 0,
  size: 50,
  sort: '@timestamp,desc',
});

async function fetchLogs() {
  loading.value = true;
  error.value = null;

  // Combine query params
  const queryParams = {
    ...pageable,
    ...filters,
    page: pageable.page, // Ensure page 0-indexing for API
  };

  // Update URL
  router.push({ query: { ...route.query, ...filters, page: pageable.page + 1 } });

  const result = await logService.queryLogs(filters, pageable);

  if (result.ok) {
    pageData.value = result.value;
  } else {
    error.value = result.error.message;
  }
  loading.value = false;
}

function applyFilters() {
  pageable.page = 0; // Reset to first page
  fetchLogs();
}

function goToPage(page) {
  pageable.page = page - 1; // Convert 1-based to 0-based
  fetchLogs();
}

onMounted(fetchLogs);

// --- Formatting Helpers ---
function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  try {
    return format(parseISO(ts), 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    return ts;
  }
}

function getLevelColor(level) {
  switch (level?.toUpperCase()) {
    case 'ERROR':
      return 'text-red-500 font-bold';
    case 'WARN':
      return 'text-yellow-500 font-bold';
    case 'INFO':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

function getAppColor(appName) {
  switch (appName) {
    case 'danxils-api':
      return 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 ring-blue-600/20';
    case 'tes':
      return 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 ring-green-600/20';
    case 'frontend':
      return 'bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 ring-purple-600/20';
    default:
      return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 ring-gray-500/10';
  }
}
</script>
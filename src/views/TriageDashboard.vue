<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { TriageDashboardController } from '@/controllers/TriageDashboardController';
import { KpiViewModel } from '@/viewmodels/KpiViewModel';
// *** REMOVED WorklistView and LogDashboardView imports ***

// Controller for fetching dashboard data
const controller = new TriageDashboardController();
const loading = ref(true);
const error = ref(null);
const kpis = ref(new KpiViewModel()); // Use ViewModel for display formatting
const recentBatches = ref([]);
const pendingByErrorType = ref([]);

const loadData = async () => {
  loading.value = true;
  error.value = null;
  const result = await controller.loadAll();
  if (result.ok) {
    const snap = controller.snapshot();
    kpis.value = new KpiViewModel(snap.kpis || {}); // Update ViewModel
    recentBatches.value = snap.recentBatches;
    pendingByErrorType.value = snap.pendingByErrorType;
  } else {
    error.value = result.error?.message || "Failed to load dashboard data.";
    // Reset data on error
    kpis.value = new KpiViewModel();
    recentBatches.value = [];
    pendingByErrorType.value = [];
  }
  loading.value = false;
};

onMounted(async () => {
  await loadData();
  // Optionally start polling if desired
  // controller.startPolling();
});

onUnmounted(() => {
  // controller.stopPolling();
});

</script>

<template>
  <div class="dashboard-view">
    <h1>Dashboard Overview</h1>

    <div v-if="loading" class="loading-indicator">Loading dashboard data...</div>
    <div v-if="error" class="error-message card">{{ error }}</div>

    <section v-if="!loading && !error" class="kpi-section">
      <div class="kpi-card card">
        <h2>Pending Review</h2>
        <div class="kpi-value">{{ kpis.pendingText() }}</div>
        <router-link to="/worklist" class="kpi-link">Go to Worklist</router-link>
      </div>
      <div class="kpi-card card">
        <h2>Auto Cleared</h2>
        <div class="kpi-value">{{ kpis.clearanceText() }}</div>
        <p class="kpi-note">(Based on recent data)</p>
      </div>
      <div class="kpi-card card">
        <h2>Avg. Resolution</h2>
        <div class="kpi-value">{{ kpis.avgResolutionText() }}</div>
        <p class="kpi-note">(Estimated)</p>
      </div>
      <div class="kpi-card card">
        <h2>Pending by Type</h2>
        <ul v-if="pendingByErrorType.length">
          <li v-for="item in pendingByErrorType" :key="item.errorType">
            {{ item.errorType }}: {{ item.count }}
          </li>
        </ul>
        <p v-else>None Pending</p>
        <router-link to="/worklist" class="kpi-link">View Details</router-link>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard-view {
  /* Optional: Add specific styles for the dashboard view itself */
}

.loading-indicator, .error-message {
  padding: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
  border-radius: 4px;
}
.loading-indicator {
  background-color: #e0e0e0;
}
.error-message {
  background-color: var(--color-danger);
  color: white;
}

.kpi-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* Adjusted minmax */
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.kpi-card {
  text-align: center;
  display: flex; /* Use flexbox for layout */
  flex-direction: column;
  justify-content: space-between; /* Space out title, value, link */
}
.kpi-card h2 {
  margin-top: 0;
  font-size: 1rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-unit);
}
.kpi-value {
  font-size: 2.2rem; /* Slightly larger */
  font-weight: bold;
  color: var(--color-primary);
  margin: auto 0; /* Center vertically */
}
.kpi-card ul {
  list-style: none;
  padding: 0;
  margin: var(--spacing-unit) 0; /* Add some margin */
  font-size: 0.9rem;
  color: var(--color-text);
  text-align: left; /* Align list items left */
  padding-left: var(--spacing-unit); /* Indent list */
}
.kpi-card li {
  margin-bottom: calc(var(--spacing-unit) * 0.5);
}
.kpi-link {
  margin-top: var(--spacing-unit);
  font-size: 0.9rem;
}
.kpi-note {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: calc(var(--spacing-unit) * 0.5);
  margin-bottom: calc(var(--spacing-unit));
}

/* Removed divider and section styles as they are no longer needed here */

</style>
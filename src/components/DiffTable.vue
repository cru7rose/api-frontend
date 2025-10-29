<template>
  <div class="diff-table-component">
    <div class="diff-section">
      <h4>Pickup Differences ({{ pickupDiff?.changed || 0 }})</h4>
      <table v-if="pickupDiff?.rows?.length">
        <thead>
        <tr>
          <th>Field</th>
          <th>Before</th>
          <th>After</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in pickupDiff.rows" :key="row.field" :class="{ changed: row.changed }">
          <td>{{ row.label }}</td>
          <td>{{ formatValue(row.before) }}</td>
          <td>{{ formatValue(row.after) }}</td>
        </tr>
        </tbody>
      </table>
      <p v-else>No pickup diff data.</p>
    </div>

    <div class="diff-section">
      <h4>Delivery Differences ({{ deliveryDiff?.changed || 0 }})</h4>
      <table v-if="deliveryDiff?.rows?.length">
        <thead>
        <tr>
          <th>Field</th>
          <th>Before</th>
          <th>After</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in deliveryDiff.rows" :key="row.field" :class="{ changed: row.changed }">
          <td>{{ row.label }}</td>
          <td>{{ formatValue(row.before) }}</td>
          <td>{{ formatValue(row.after) }}</td>
        </tr>
        </tbody>
      </table>
      <p v-else>No delivery diff data.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pickupDiff: Object, // Expects { rows: [{field, label, before, after, changed}], changed: number }
  deliveryDiff: Object,
});

const formatValue = (value) => {
  if (value === null || value === undefined) return '(empty)';
  return String(value);
};

</script>

<style scoped>
.diff-table-component {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.diff-section {
  flex: 1;
  min-width: 300px;
}
h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1em;
  color: #555;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}
th, td {
  border: 1px solid #eee;
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
th {
  background-color: #f8f8f8;
}
tr.changed td {
  background-color: #fff3cd; /* Highlight changed rows */
  font-weight: bold;
}
td:first-child { /* Field name */
  font-style: italic;
  color: #666;
  width: 100px; /* Fixed width for field names */
}
p {
  font-style: italic;
  color: #888;
}
</style>
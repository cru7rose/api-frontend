<script setup>
const props = defineProps({
  detail: Object
});
</script>

<template>
  <div v-if="detail" class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">Order Details</h3>
    <div class="grid grid-cols-3 gap-y-1 text-sm">
      <div class="font-medium text-gray-700">Barcode:</div>
      <div>{{ detail.barcode }}</div>
      <div></div>

      <div class="font-medium text-gray-700">Customer ID:</div>
      <div>{{ detail.customerId }}</div>
      <div></div>

      <div class="font-medium text-gray-700">Request ID:</div>
      <div>{{ detail.requestId }}</div>
      <div></div>
    </div>
  </div>
</template>

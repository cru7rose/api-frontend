<script setup>
import { Address } from "@/domain/WorkbenchModels.js";
import { ref, watch, computed } from 'vue';

const props = defineProps({
  title: String,
  initialAddress: Object,
  validation: Object,
  savePolicy: Object
});

const emit = defineEmits(['change', 'useOriginal', 'saveAndNext']);

const formAddress = ref(Address.from(props.initialAddress));
const formState = ref({
  isChanged: false,
  isGeocoding: false,
  error: null,
  // Add state for bulk checkbox
  applyToSimilar: false
});

// Watch initialAddress to update form state when parent loads new data
watch(() => props.initialAddress, (newAddr) => {
  formAddress.value = Address.from(newAddr);
  formState.value.isChanged = false;
  formState.value.applyToSimilar = false; // Reset checkbox on new order load
}, { deep: true, immediate: true });

// Emit changes to parent whenever formAddress changes
watch(formAddress, (newAddr) => {
  // Basic change detection logic to enable/disable save
  const changed = JSON.stringify(newAddr.toPlain()) !== JSON.stringify(props.initialAddress.toPlain());
  formState.value.isChanged = changed;
  // Emit the new address and the bulk flag status
  emit('change', newAddr, formState.value.applyToSimilar);
}, { deep: true });

// Emit change whenever applyToSimilar state changes
watch(() => formState.value.applyToSimilar, (newVal) => {
  emit('change', formAddress.value, newVal);
});


const errors = computed(() => props.validation?.errors || {});

function handleGeocode() {
  formState.value.isGeocoding = true;
  setTimeout(() => formState.value.isGeocoding = false, 1000); // Simulate loading
}

function handleSave() {
  // Pass the bulk flag when saving
  emit('saveAndNext', formState.value.applyToSimilar);
}
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
    <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col">
        <label class="text-sm font-medium">Street</label>
        <input type="text" v-model="formAddress.street"
               :class="{'border-red-500': errors.street}" class="border p-2 rounded text-sm"/>
        <p v-if="errors.street" class="text-xs text-red-500 mt-1">{{ errors.street }}</p>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium">House No.</label>
        <input type="text" v-model="formAddress.houseNumber"
               :class="{'border-red-500': errors.houseNumber}" class="border p-2 rounded text-sm"/>
        <p v-if="errors.houseNumber" class="text-xs text-red-500 mt-1">{{ errors.houseNumber }}</p>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium">Postal Code</label>
        <input type="text" v-model="formAddress.postalCode"
               :class="{'border-red-500': errors.postalCode}" class="border p-2 rounded text-sm"/>
        <p v-if="errors.postalCode" class="text-xs text-red-500 mt-1">{{ errors.postalCode }}</p>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium">City</label>
        <input type="text" v-model="formAddress.city"
               :class="{'border-red-500': errors.city}" class="border p-2 rounded text-sm"/>
        <p v-if="errors.city" class="text-xs text-red-500 mt-1">{{ errors.city }}</p>
      </div>

      <!-- Latitude/Longitude -->
      <div class="flex flex-col">
        <label class="text-sm font-medium">Latitude</label>
        <input type="text" v-model="formAddress.latitude"
               :class="{'border-red-500': errors.latitude}" class="border p-2 rounded text-sm"/>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium">Longitude</label>
        <input type="text" v-model="formAddress.longitude"
               :class="{'border-red-500': errors.longitude}" class="border p-2 rounded text-sm"/>
      </div>
    </div>

    <!-- Bulk/Policy Control -->
    <div class="pt-2 border-t mt-4">
      <label class="flex items-center text-sm font-medium cursor-pointer">
        <input type="checkbox" v-model="formState.applyToSimilar"
               class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
        Apply correction to all similar pending orders
      </label>
    </div>

    <div class="flex justify-between items-center pt-2">
      <div class="text-sm font-medium" :class="{'text-red-600': !savePolicy?.enabled && formState.isChanged, 'text-gray-600': !formState.isChanged}">
        {{ formState.isChanged ? `Unsaved changes. Reason: ${savePolicy?.reason}` : 'No changes detected.' }}
      </div>

      <div class="flex gap-2">
        <button @click="$emit('useOriginal')"
                class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-300 transition">
          Use Original
        </button>

        <button @click="handleGeocode" :disabled="formState.isGeocoding"
                class="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition disabled:bg-gray-400">
          {{ formState.isGeocoding ? 'Geocoding...' : 'Geocode Edited' }}
        </button>

        <button @click="handleSave" :disabled="!savePolicy?.enabled"
                class="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400">
          Save & Next
        </button>
      </div>
    </div>
  </div>
</template>

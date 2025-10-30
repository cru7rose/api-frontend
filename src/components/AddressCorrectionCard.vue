<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">{{ title }}</h3>
      <p v-if="reasonCode" class="mt-1 text-sm text-red-600 dark:text-red-400">
        Reason: {{ reasonCode }}
      </p>
    </div>

    <div class="px-4 py-5 sm:p-6">
      <div class="sm:hidden">
        <label for="tabs" class="sr-only">Select a tab</label>
        <select
            :id="`${side}-tabs`"
            name="tabs"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
            @change="currentTab = $event.target.value"
        >
          <option value="edit" :selected="currentTab === 'edit'">Edit</option>
          <option value="original" :selected="currentTab === 'original'">Original (From Source)</option>
          <option value="stored" :selected="currentTab === 'stored'" v-if="storedAddress">
            Stored (TrackIT)
          </option>
        </select>
      </div>
      <div class="hidden sm:block">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
                @click="currentTab = 'edit'"
                :class="[
                currentTab === 'edit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              ]"
            >
              Edit
            </button>
            <button
                @click="currentTab = 'original'"
                :class="[
                currentTab === 'original'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              ]"
            >
              Original (From Source)
            </button>
            <button
                v-if="storedAddress"
                @click="currentTab = 'stored'"
                :class="[
                currentTab === 'stored'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              ]"
            >
              Stored (TrackIT)
            </button>
          </nav>
        </div>
      </div>

      <div class="mt-6">
        <div v-show="currentTab === 'edit'" class="space-y-4">

          <FormInput
              :label="`${title} Alias`"
              :model-value="editableAddress.alias"
              @update:model-value="emitChange('alias', $event)"
              :id="`${side}-alias`"
              :disabled="!isPending"
          />
          <FormInput
              :label="`${title} Name (Attention)`"
              :model-value="editableAddress.name"
              @update:model-value="emitChange('name', $event)"
              :id="`${side}-name`"
              :disabled="!isPending"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
                label="Street"
                :model-value="editableAddress.street"
                @update:model-value="emitChange('street', $event)"
                :id="`${side}-street`"
                :disabled="!isPending"
            />
            <FormInput
                label="House No."
                :model-value="editableAddress.houseNumber"
                @update:model-value="emitChange('houseNumber', $event)"
                :id="`${side}-houseNumber`"
                :disabled="!isPending"
            />
            <FormInput
                label="Postal Code"
                :model-value="editableAddress.postalCode"
                @update:model-value="emitChange('postalCode', $event)"
                :id="`${side}-postalCode`"
                :disabled="!isPending"
            />
            <FormInput
                label="City"
                :model-value="editableAddress.city"
                @update:model-value="emitChange('city', $event)"
                :id="`${side}-city`"
                :disabled="!isPending"
            />

            <FormInput
                label="Latitude"
                type="number"
                step="any"
                :model-value="editableAddress.latitude"
                @update:model-value="emitChange('latitude', $event ? parseFloat($event) : null)"
                :id="`${side}-latitude`"
                :disabled="!isPending"
            />
            <FormInput
                label="Longitude"
                type="number"
                step="any"
                :model-value="editableAddress.longitude"
                @update:model-value="emitChange('longitude', $event ? parseFloat($event) : null)"
                :id="`${side}-longitude`"
                :disabled="!isPending"
            />
          </div>

          <div class="pt-4 flex justify-between">
            <button
                @click="emit('use-original')"
                :disabled="!isPending"
                class="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Use Original
            </button>

            <div class="flex gap-2">
              <button
                  @click="emit('geocode')"
                  :disabled="!isPending || geocodeLoading"
                  class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
              >
                {{ geocodeLoading ? 'Geocoding...' : 'Geocode & Fill' }}
              </button>

              <button
                  @click="emit('save')"
                  :disabled="!isPending"
                  class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                Save {{ title }}
              </button>
            </div>
          </div>
        </div>

        <div v-show="currentTab === 'original'">
          <AddressDisplay :address="originalAddress" title="Original Address" :show-coords="true" />
        </div>

        <div v-show="currentTab === 'stored'" v-if="storedAddress">
          <AddressDisplay :address="storedAddress" title="Stored Address (TrackIT)" :show-coords="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import AddressDisplay from '@/components/AddressDisplay.vue';
import FormInput from '@/components/FormInput.vue';
// Note: AddressInputGroup is removed and fields are now in this component

const props = defineProps({
  title: { type: String, required: true },
  side: { type: String, required: true },
  originalAddress: { type: Object, default: () => ({}) },
  storedAddress: { type: Object, default: undefined },
  reasonCode: { type: String, default: '' },
  isPending: { type: Boolean, default: false },
  editableAddress: { type: Object, required: true }, // Expects full Address object from WorkbenchModels
  geocodeLoading: { type: Boolean, default: false }
});

const emit = defineEmits([
  'update:editableAddress',
  'geocode',
  'save',
  'use-original'
]);

const currentTab = ref('edit');

const emitChange = (field, value) => {
  emit('update:editableAddress', {
    ...props.editableAddress,
    [field]: value
  });
};
</script>
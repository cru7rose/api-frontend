<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div v-if="loading" class="text-center">
      <p>Loading order details...</p>
    </div>
    <div v-else-if="error" class="text-red-500 text-center">
      <p>
        Failed to load order details: {{ error }}
        <span v-if="orderId"> (ID: {{ orderId }})</span>
      </p>
    </div>
    <div v-else-if="currentOrder" class="space-y-8">
      <PageHeader
          :title="`Correction Editor (Barcode: ${currentOrder.barcode})`"
          :subtitle="`Source: ${currentOrder.sourceSystem} | Status: ${currentOrder.processingStatus}`"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddressCorrectionCard
            title="Pickup Address"
            side="pickup"
            :original-address="originalPickup"
            :stored-address="storedPickup"
            :reason-code="currentOrder.pickupReasonCode"
            :is-pending="isPending"
            v-model:editableAddress="editablePickup.address"
            v-model:alias="editablePickup.alias"
            v-model:name="editablePickup.name"
            @geocode="geocodeAddress('pickup')"
        />

        <AddressCorrectionCard
            title="Delivery Address"
            side="delivery"
            :original-address="originalDelivery"
            :stored-address="storedDelivery"
            :reason-code="currentOrder.deliveryReasonCode"
            :is-pending="isPending"
            v-model:editableAddress="editableDelivery.address"
            v-model:alias="editableDelivery.alias"
            v-model:name="editableDelivery.name"
            @geocode="geocodeAddress('delivery')"
        />
      </div>

      <div class="mt-8">
        <CorrectionMap
            :pickup="editablePickup.address"
            :delivery="editableDelivery.address"
            :route="routeData"
        />
      </div>

      <div
          v-if="isPending"
          class="mt-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="flex items-center">
          <input
              id="applyToSimilar"
              type="checkbox"
              v-model="applyToSimilar"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="applyToSimilar" class="ml-2 block text-sm text-gray-900 dark:text-gray-100"
          >Apply this correction to all similar pending errors</label
          >
        </div>
        <div class="flex items-center space-x-2">
          <span
              v-if="orderStore.isLoading || addressStore.isLoading || addressStore.isRouting"
              class="text-sm italic text-gray-500 dark:text-gray-400"
          >
            {{ orderStore.isLoading ? 'Saving...' : (addressStore.isLoading ? 'Geocoding...' : 'Calculating route...') }}
          </span>
          <button
              @click="saveAddressCorrection"
              :disabled="orderStore.isLoading"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            Save & Approve Correction
          </button>
        </div>
      </div>
      <div v-else class="mt-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg text-center">
        <p class="font-semibold text-gray-700 dark:text-gray-200">
          This order is not in a 'PENDING_VERIFICATION' state and cannot be corrected. (Status:
          {{ currentOrder.processingStatus }})
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/orderStore'
import { useAddressStore } from '@/stores/addressStore' // <-- CORRECTED IMPORT
import type { OrderDetailDTO } from '@/model/OrderDetailDTO'
import type { AddressDto } from '@/model/AddressDto'
import type { OrderCorrectionRequestDTO, CorrectedAddress } from '@/model/OrderCorrectionRequestDTO'
import type { OsrmRoute } from '@/stores/addressStore'
import PageHeader from '@/components/PageHeader.vue'
import AddressCorrectionCard from '@/components/AddressCorrectionCard.vue'
import CorrectionMap from '@/components/CorrectionMap.vue' // <-- NEW MAP IMPORT
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const addressStore = useAddressStore() // <-- CORRECTED STORE
const toast = useToast()

const orderId = ref<string | null>(route.params.id as string)
const currentOrder = ref<OrderDetailDTO | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

interface EditableAddressData {
  alias: string
  name: string
  address: AddressDto
}

const editablePickup = ref<EditableAddressData>({
  alias: '',
  name: '',
  address: { street: '', houseNumber: '', postalCode: '', city: '' }
})

const editableDelivery = ref<EditableAddressData>({
  alias: '',
  name: '',
  address: { street: '', houseNumber: '', postalCode: '', city: '' }
})

const applyToSimilar = ref(false)
const resolveCoordinates = ref(false)
const routeData = ref<OsrmRoute | null>(null) // <-- NEW STATE FOR ROUTE

const isPending = computed(
    () => currentOrder.value?.processingStatus === 'PENDING_VERIFICATION'
)

const originalPickup = computed(() => currentOrder.value?.pickupAddress)
const originalDelivery = computed(() => currentOrder.value?.deliveryAddress)
const storedPickup = computed(() => currentOrder.value?.pickupStoredAddress)
const storedDelivery = computed(() => currentOrder.value?.deliveryStoredAddress)

const loadErrorDetails = async () => {
  // ... (Same as previous version)
  if (!orderId.value) {
    error.value = 'No Order ID provided.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    const orderDetail = await orderStore.fetchOrderDetails(orderId.value)
    currentOrder.value = orderDetail

    editablePickup.value = {
      alias: orderDetail.pickupAlias || '',
      name: orderDetail.pickupName || '',
      address: {
        street: orderDetail.pickupAddress?.street || '',
        houseNumber: orderDetail.pickupAddress?.houseNumber || '',
        postalCode: orderDetail.pickupAddress?.postalCode || '',
        city: orderDetail.pickupAddress?.city || '',
        latitude: orderDetail.pickupAddress?.latitude,
        longitude: orderDetail.pickupAddress?.longitude
      }
    }

    editableDelivery.value = {
      alias: orderDetail.deliveryAlias || '',
      name: orderDetail.deliveryName || '',
      address: {
        street: orderDetail.deliveryAddress?.street || '',
        houseNumber: orderDetail.deliveryAddress?.houseNumber || '',
        postalCode: orderDetail.deliveryAddress?.postalCode || '',
        city: orderDetail.deliveryAddress?.city || '',
        latitude: orderDetail.deliveryAddress?.latitude,
        longitude: orderDetail.deliveryAddress?.longitude
      }
    }
  } catch (e: any) {
    console.error('Error fetching order details:', e)
    error.value = e.message || 'An unknown error occurred'
    currentOrder.value = null
  } finally {
    loading.value = false
  }
}

const geocodeAddress = async (side: 'pickup' | 'delivery') => {
  const addressToGeocode =
      side === 'pickup' ? editablePickup.value.address : editableDelivery.value.address
  toast.info(`Geocoding ${side} address...`, 2000)

  try {
    const opId = await addressStore.verifyAddress(addressToGeocode) // <-- Use corrected store
    toast.info(`Geocoding request queued. Polling...`, 3000)

    const result = await addressStore.pollForOperationResult(opId) // <-- Use corrected store

    if (result.status === 'VALID' && result.suggestions && result.suggestions.length > 0) {
      const bestMatch = result.suggestions[0]
      const newAddress: AddressDto = {
        street: bestMatch.street,
        houseNumber: bestMatch.houseNumber,
        postalCode: bestMatch.postalCode,
        city: bestMatch.city,
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude
      }

      if (side === 'pickup') {
        editablePickup.value.address = newAddress
      } else {
        editableDelivery.value.address = newAddress
      }
      resolveCoordinates.value = true
      toast.success('Geocoding successful. Address updated.', 3000)
    } else {
      toast.warn(`Geocoding complete. Status: ${result.status}`, 5000)
    }
  } catch (e: any) {
    console.error('Geocoding error:', e)
    toast.error(`Geocoding failed: ${e.message}`, 5000)
  }
}

const saveAddressCorrection = async () => {
  // ... (Same as previous version)
  if (!currentOrder.value) {
    toast.error('Cannot save, no order data loaded.', 5000)
    return
  }

  const pickupCorrection: CorrectedAddress = {
    alias: editablePickup.value.alias,
    name: editablePickup.value.name,
    address: editablePickup.value.address
  }

  const deliveryCorrection: CorrectedAddress = {
    alias: editableDelivery.value.alias,
    name: editableDelivery.value.name,
    address: editableDelivery.value.address
  }

  const payload: OrderCorrectionRequestDTO = {
    pickup: pickupCorrection,
    delivery: deliveryCorrection,
    resolveCoordinatesIfNeeded: resolveCoordinates.value,
    applyToSimilar: applyToSimilar.value
  }

  try {
    await orderStore.approveOrder(currentOrder.value.barcode, payload)
    toast.success('Order successfully approved and resubmitted!', 5000)
    router.push({ name: 'TriageWorklist' })
  } catch (e: any) {
    console.error('Failed to save correction:', e)
    toast.error(`Save failed: ${e.message}`, 10000)
  }
}

/**
 * [NEW] Fetches the route from OSRM when addresses change.
 */
const updateRoute = async () => {
  if (
      editablePickup.value.address.latitude &&
      editableDelivery.value.address.latitude
  ) {
    routeData.value = await addressStore.fetchRoute(
        editablePickup.value.address,
        editableDelivery.value.address
    )
  } else {
    routeData.value = null
  }
}

// Watch for changes on the addresses to auto-update the route
watch(editablePickup, updateRoute, { deep: true })
watch(editableDelivery, updateRoute, { deep: true })

watch(
    () => route.params.id,
    (newId) => {
      if (newId) {
        orderId.value = newId as string
        loadErrorDetails()
      }
    },
    { immediate: true }
)

onMounted(() => {
  // Initial load is handled by the immediate watch
  // We also trigger an initial route calculation
  updateRoute()
})
</script>
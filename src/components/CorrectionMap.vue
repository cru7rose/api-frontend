<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
    <div ref="mapContainer" style="height: 400px; width: 100%; border-radius: 8px"></div>
    <div v-if="route" class="mt-4 text-center text-gray-700 dark:text-gray-200">
      <p>
        <strong>Distance:</strong> {{ (route.distance / 1000).toFixed(2) }} km |
        <strong>Duration:</strong> {{ (route.duration / 60).toFixed(0) }} minutes
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { PropType } from 'vue'
import type { AddressDto } from '@/model/AddressDto'
import type { OsrmRoute } from '@/stores/addressStore'

// Import Leaflet. This relies on Leaflet being installed in the project.
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
})

// Define custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const props = defineProps({
  pickup: {
    type: Object as PropType<AddressDto>,
    required: true
  },
  delivery: {
    type: Object as PropType<AddressDto>,
    required: true
  },
  route: {
    type: Object as PropType<OsrmRoute | null>,
    default: null
  }
})

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map | null>(null)
const pickupMarker = ref<L.Marker | null>(null)
const deliveryMarker = ref<L.Marker | null>(null)
const routeLayer = ref<L.GeoJSON | null>(null)

onMounted(() => {
  if (mapContainer.value) {
    map.value = L.map(mapContainer.value).setView([52.23, 21.01], 6) // Center on Poland

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.value)

    // Wait for initial props to be available
    nextTick(() => {
      updateMarkers()
      updateRoute()
    })
  }
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})

// --- Helper Functions ---

const updateMarkers = () => {
  if (!map.value) return

  // Pickup Marker
  if (props.pickup.latitude && props.pickup.longitude) {
    if (pickupMarker.value) {
      pickupMarker.value.setLatLng([props.pickup.latitude, props.pickup.longitude])
    } else {
      pickupMarker.value = L.marker([props.pickup.latitude, props.pickup.longitude], {
        icon: pickupIcon
      })
          .addTo(map.value)
          .bindPopup('Point A: Pickup')
    }
  }

  // Delivery Marker
  if (props.delivery.latitude && props.delivery.longitude) {
    if (deliveryMarker.value) {
      deliveryMarker.value.setLatLng([props.delivery.latitude, props.delivery.longitude])
    } else {
      deliveryMarker.value = L.marker([props.delivery.latitude, props.delivery.longitude], {
        icon: deliveryIcon
      })
          .addTo(map.value)
          .bindPopup('Point B: Delivery')
    }
  }

  fitBounds()
}

const updateRoute = () => {
  if (!map.value) return

  // Remove old route
  if (routeLayer.value) {
    map.value.removeLayer(routeLayer.value)
  }

  // Add new route
  if (props.route && props.route.geometry) {
    routeLayer.value = L.geoJSON(props.route.geometry, {
      style: {
        color: '#0055b3', // A nice blue
        weight: 5
      }
    }).addTo(map.value)
  }

  fitBounds()
}

const fitBounds = () => {
  if (!map.value) return

  const bounds = L.latLngBounds([])
  if (pickupMarker.value) {
    bounds.extend(pickupMarker.value.getLatLng())
  }
  if (deliveryMarker.value) {
    bounds.extend(deliveryMarker.value.getLatLng())
  }

  if (bounds.isValid()) {
    map.value.fitBounds(bounds, { padding: [50, 50] })
  }
}

// Watch for changes in props and update map
watch(() => props.pickup, updateMarkers, { deep: true })
watch(() => props.delivery, updateMarkers, { deep: true })
watch(() => props.route, updateRoute)
</script>
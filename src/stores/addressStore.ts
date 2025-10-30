// ============================================================================
// Frontend: Refactor addressStore.ts (Supersedes source 4683-4712)
// REASON:
// 1. Add `isRouting` state and `fetchRoute` action.
// 2. The `fetchRoute` action calls the /osrm proxy (port 5000)
//    to get route data, requesting GeoJSON for easy map rendering.
// ============================================================================
import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api' //
import { useAddressVerificationStore } from './addressVerificationStore' //
import type { AddressDto } from '@/model/AddressDto'
import type { OperationResult } from '@/model/OperationResult'

// Interface for the OSRM Route response
export interface OsrmRoute {
    geometry: any // GeoJSON geometry
    distance: number // in meters
    duration: number // in seconds
}

export const useAddressStore = defineStore('address', () => {
    const verificationStore = useAddressVerificationStore()
    const isLoading = ref(false)
    const isRouting = ref(false) // <-- New state for routing loader

    /**
     * Queues an address for verification.
     *
     */
    async function verifyAddress(address: AddressDto): Promise<string> {
        isLoading.value = true
        try {
            const operationId = await verificationStore.queueForVerification(address)
            return operationId
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Polls for the result of a verification operation.
     *
     */
    async function pollForOperationResult(operationId: string): Promise<OperationResult> {
        isLoading.value = true
        try {
            const result = await verificationStore.pollForResult(operationId)
            return result
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [NEW] Fetches route data from the OSRM service.
     */
    async function fetchRoute(
        pickup: AddressDto,
        delivery: AddressDto
    ): Promise<OsrmRoute | null> {
        // Check if we have coordinates for both points
        if (
            !pickup.longitude ||
            !pickup.latitude ||
            !delivery.longitude ||
            !delivery.latitude
        ) {
            return null
        }

        isRouting.value = true
        try {
            const coords = `${pickup.longitude},${pickup.latitude};${delivery.longitude},${delivery.latitude}`

            // Request GeoJSON for easy Leaflet rendering
            const url = `/osrm/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`

            const { data } = await api.get(url)

            if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data.routes[0] as OsrmRoute
            }
            return null
        } catch (error) {
            console.error('Error fetching OSRM route:', error)
            return null
        } finally {
            isRouting.value = false
        }
    }

    return {
        isLoading,
        isRouting, // <-- Expose new state
        verifyAddress,
        pollForOperationResult,
        fetchRoute // <-- Expose new action
    }
})
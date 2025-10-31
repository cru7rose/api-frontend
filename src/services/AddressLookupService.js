// FILE: src/services/AddressLookupService.js (NEW FILE)
// REASON: Implements frontend part of feature request 3 (Address Suggestions Tool).
//         This service calls the backend's /api/address-lookup endpoints.

import apiClient from '@/services/api.js';

/**
 * ARCHITECTURE: Frontend service to call the backend's AddressLookupController.
 * This fetches suggestions for streets, postals, and cities.
 */
export class AddressLookupService {
    constructor(client = apiClient) {
        this.api = client;
    }

    /**
     * Fetches street suggestions based on postal code and city.
     * @param {string} postalCode
     * @param {string} city
     * @returns {Promise<Array<{value: string, latitude: number, longitude: number}>>}
     */
    async findStreets(postalCode, city) {
        if (!postalCode || !city) return [];
        try {
            const params = new URLSearchParams({ postalCode, city });
            const response = await this.api.get(`/api/address-lookup/streets?${params.toString()}`);
            return response.data || [];
        } catch (error) {
            console.error(`[AddressLookupService] Failed to findStreets for ${postalCode}, ${city}:`, error);
            throw new Error(`Failed to fetch street suggestions: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Fetches postal code suggestions based on street and city.
     * @param {string} street
     * @param {string} city
     * @returns {Promise<Array<{value: string, latitude: number, longitude: number}>>}
     */
    async findPostalCodes(street, city) {
        if (!street || !city) return [];
        try {
            const params = new URLSearchParams({ street, city });
            const response = await this.api.get(`/api/address-lookup/postalcodes?${params.toString()}`);
            return response.data || [];
        } catch (error) {
            console.error(`[AddressLookupService] Failed to findPostalCodes for ${street}, ${city}:`, error);
            throw new Error(`Failed to fetch postal code suggestions: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Fetches city suggestions based on postal code.
     * @param {string} postalCode
     * @returns {Promise<Array<{value: string, latitude: number, longitude: number}>>}
     */
    async findCities(postalCode) {
        if (!postalCode) return [];
        try {
            const params = new URLSearchParams({ postalCode });
            const response = await this.api.get(`/api/address-lookup/cities?${params.toString()}`);
            return response.data || [];
        } catch (error) {
            console.error(`[AddressLookupService] Failed to findCities for ${postalCode}:`, error);
            throw new Error(`Failed to fetch city suggestions: ${error.response?.data?.error || error.message}`);
        }
    }
}
// Nominatim geocoder: produces { latitude, longitude } or null
import axios from 'axios'

export function createNominatimAdapter({ baseUrl = '/nominatim', email = '' } = {}) {
    const client = axios.create({
        baseURL: baseUrl.replace(/\/+$/, ''),
        timeout: 10000,
    })

    function buildQuery(address) {
        // address can be your Address model; pick the usual fields
        const parts = [
            address?.street,
            address?.houseNumber,
            address?.postalCode,
            address?.city,
            address?.countryCode,
        ].filter(Boolean)
        return parts.join(' ')
    }

    return {
        async geocode(address) {
            const q = buildQuery(address)
            if (!q || q.length < 3) return null

            const params = {
                q,
                format: 'jsonv2',
                addressdetails: 1,
                limit: 1,
                email: email || undefined,
            }

            const res = await client.get('/search', { params })
            const hit = Array.isArray(res.data) ? res.data[0] : null
            if (!hit?.lat || !hit?.lon) return null
            return { latitude: parseFloat(hit.lat), longitude: parseFloat(hit.lon) }
        },
    }
}

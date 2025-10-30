// Minimal OSRM adapter, useful if you draw routes later
import axios from 'axios'

export function createOsrmAdapter({ baseUrl = '/osrm' } = {}) {
    const client = axios.create({
        baseURL: baseUrl.replace(/\/+$/, ''),
        timeout: 20000,
    })

    return {
        async route(pickup, delivery) {
            // pickup/delivery: {lat, lon}
            if (!pickup || !delivery) return null
            const coords = `${pickup.lon},${pickup.lat};${delivery.lon},${delivery.lat}`
            const url = `/route/v1/driving/${coords}`
            const res = await client.get(url, { params: { overview: 'full', geometries: 'geojson' } })
            return res.data
        },
    }
}

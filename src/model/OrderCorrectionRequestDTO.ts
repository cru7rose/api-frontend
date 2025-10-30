// ============================================================================
// Frontend: New DTO
// FILE: src/model/OrderCorrectionRequestDTO.ts (NEW FILE)
// REASON: Defines the new payload for the 'approveOrder' (Save) endpoint,
//         replacing the old simple approval request.
// ============================================================================
import type { AddressDto } from './AddressDto'

/**
 * Represents a corrected address payload sent from the frontend.
 */
export interface CorrectedAddress {
    alias: string
    name: string
    address: AddressDto
}

/**
 * The main request body for approving/correcting an order.
 * This matches the DTO expected by the DANXILS-API backend.
 */
export interface OrderCorrectionRequestDTO {
    /** The corrected pickup details. If null, pickup is assumed unchanged. */
    pickup: CorrectedAddress | null
    /** The corrected delivery details. If null, delivery is assumed unchanged. */
    delivery: CorrectedAddress | null
    /** Flag to tell TES to geocode the new address if it's a new alias. */
    resolveCoordinatesIfNeeded: boolean
    /** Flag to apply this correction to other similar pending errors. */
    applyToSimilar: boolean
}
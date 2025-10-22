/**
 * ARCHITECTURE: ValidationService provides basic, potentially country-specific,
 * validation rules for address fields. Adheres to SRP by isolating validation logic.
 * This is a basic stub implementation; enhance with actual rules as needed.
 */
export class ValidationService {
    constructor(countryCode = "PL") {
        this.countryCode = countryCode.toUpperCase();
        // Basic required fields for PL example
        this.requiredFields = ["street", "postalCode", "city", "country"];
        // Basic regex for PL postal code example
        this.postalRegex = /^\d{2}-\d{3}$/;
    }

    /**
     * Validates an address object based on configured rules.
     * @param {object} address - The address object to validate (e.g., { street, postalCode, city, country }).
     * @returns {{valid: boolean, errors: object}} - Validation result.
     */
    validate(address) {
        const errors = {};
        let valid = true;

        if (!address) {
            return { valid: false, errors: { general: "Address object is missing." } };
        }

        // Check required fields
        for (const field of this.requiredFields) {
            if (!address[field] || String(address[field]).trim() === "") {
                errors[field] = `${field} is required.`;
                valid = false;
            }
        }

        // Check postal code format (example for PL)
        if (this.countryCode === "PL" && address.postalCode && !this.postalRegex.test(String(address.postalCode).trim())) {
            errors.postalCode = "Invalid postal code format (expected XX-XXX).";
            valid = false;
        }

        // Add more specific validation rules here (length, character sets, etc.)

        return { valid, errors };
    }
}
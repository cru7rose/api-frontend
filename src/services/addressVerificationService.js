// PLIK: src/services/addressVerificationService.js
import apiClient from '@/services/api.js';

/**
 * ARCHITEKTURA: Serwis frontendowy do obsługi synchronicznej weryfikacji adresów.
 * Komunikuje się z nowym, synchronicznym endpointem proxy w DANXILS_API,
 * który z kolei odpytuje TES-service. Zapewnia natychmiastową odpowiedź
 * dla interfejsu użytkownika, stanowiąc dedykowane rozwiązanie dla interaktywnych
 * komponentów UI i celowo oddzielone od asynchronicznego `addressSuggestionService`.
 */
export const verifyAddress = async (addressQuery) => {
    if (!addressQuery || !addressQuery.street || !addressQuery.city || !addressQuery.postalCode) {
        throw new Error("Ulica, miasto i kod pocztowy są wymagane do weryfikacji.");
    }
    
    try {
        const response = await apiClient.get('/api/address-tools/verify', {
            params: addressQuery
        });
        return response.data;
    } catch (error) {
        console.error('Błąd podczas synchronicznej weryfikacji adresu:', error);
        const errorMessage = error.response?.data?.error || 'Wystąpił błąd podczas weryfikacji adresu.';
        throw new Error(errorMessage);
    }
};
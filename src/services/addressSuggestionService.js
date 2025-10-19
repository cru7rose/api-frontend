// PLIK: services/addressSuggestionService.js

import apiClient from '@/services/api.js';

/**
 * ARCHITEKTURA: Serwis frontendowy do obsługi asynchronicznej weryfikacji adresów.
 * Komunikuje się ze starym, opartym na Kafce i pollingu, API w DANXILS_API.
 * Funkcja pollForResults cyklicznie odpytuje backend o status operacji
 * zainicjowanej przez fetchOnDemandSuggestions lub fetchByNameSearch.
 */
const pollForResults = async (correlationId) => {
  const maxRetries = 10;
  const interval = 2000;

  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));
    
    // POPRAWKA: Usunięto prefiks '/api' ze ścieżki.
    // Ścieżka jest teraz względna do 'baseURL' zdefiniowanego w apiClient.
    const statusResponse = await apiClient.get(`/api/admin/address-verification/operations/${correlationId}`);
    const operation = statusResponse.data;

    if (operation.status === 'COMPLETED') {
      return operation.result?.suggestions || [];
    }
    if (operation.status === 'FAILED') {
      throw new Error(operation.errorDetails || 'Operacja wyszukiwania sugestii nie powiodła się.');
    }
  }
  throw new Error('Przekroczono czas oczekiwania na sugestie adresowe.');
};

export const fetchOnDemandSuggestions = async (addressQuery) => {
  if (!addressQuery || Object.values(addressQuery).every(v => !v)) {
    return [];
  }
  
  try {
    // POPRAWKA: Usunięto prefiks '/api'.
    const initiateResponse = await apiClient.post('/api/admin/address-verification/suggest-on-demand', addressQuery);
    const correlationId = initiateResponse.data.correlationId;
    if (!correlationId) {
        throw new Error("API nie zwróciło correlationId dla operacji sugestii.");
    }
    return await pollForResults(correlationId);
  } catch (error) {
    console.error('Błąd podczas pobierania dynamicznych sugestii:', error);
    return [];
  }
};

export const fetchByNameSearch = async (searchQuery) => {
  if (!searchQuery || searchQuery.trim() === '') {
    return [];
  }
  
  try {
    // POPRAWKA: Usunięto prefiks '/api'.
    const initiateResponse = await apiClient.post('/api/admin/address-verification/search-by-name', searchQuery, {
        headers: { 'Content-Type': 'text/plain' }
    });
    const correlationId = initiateResponse.data.correlationId;
    if (!correlationId) {
        throw new Error("API nie zwróciło correlationId dla operacji wyszukiwania.");
    }
    return await pollForResults(correlationId);
  } catch (error) {
    console.error('Błąd podczas wyszukiwania po nazwie:', error);
    return [];
  }
};
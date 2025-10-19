// PLIK: src/stores/processingErrorsStore.js (NOWY PLIK)

import { defineStore } from 'pinia';
import apiClient from '@/services/api';

/**
 * ARCHITEKTURA: Dedykowany magazyn stanu (Pinia Store) dla zarządzania błędami przetwarzania.
 * Hermetyzuje całą logikę biznesową związaną z pobieraniem, filtrowaniem i ponawianiem
 * błędnych zleceń, komunikując się z backendem przez ujednolicony apiClient.
 */
export const useProcessingErrorsStore = defineStore('processingErrors', {
  state: () => ({
    errors: [],
    pagination: {
      page: 0,
      size: 15,
      totalElements: 0,
      totalPages: 0,
    },
    currentErrorDetails: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchProcessingErrors(params) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/processing-errors', { params });
        this.errors = response.data.content;
        this.pagination = {
          page: response.data.number,
          size: response.data.size,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
        };
      } catch (err) {
        this.error = "Nie udało się pobrać błędów przetwarzania.";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchErrorDetails(errorId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/processing-errors/${errorId}`);
        this.currentErrorDetails = response.data;
      } catch (err) {
        this.error = `Nie udało się pobrać szczegółów błędu o ID ${errorId}.`;
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async resubmitCorrectedOrder(eventId, resubmitPayload) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/processing-errors/${eventId}/resubmit`, resubmitPayload);
        // Po udanym ponowieniu można odświeżyć listę
        await this.fetchProcessingErrors({ page: this.pagination.page, size: this.pagination.size });
        return response.data;
      } catch (err) {
        this.error = "Ponowne przetworzenie zlecenia nie powiodło się.";
        console.error(err);
        throw err; // Rzuć błąd dalej, aby komponent mógł na niego zareagować
      } finally {
        this.isLoading = false;
      }
    },
  },
});
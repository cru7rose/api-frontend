import { defineStore } from 'pinia'
import apiClient from '@/services/api.js';

export const useErrorStore = defineStore('error', {
  state: () => ({
    rejectedRequests: [],
    selectedRequestDetails: null,
    isLoading: false,
    pagination: {
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 15,
    },
    filters: {
      errorType: '',
      barcode: '',
      dateFrom: '',
      dateTo: '',
    },
    sort: {
      field: 'createdAt',
      direction: 'DESC',
    }
  }),
  actions: {
    async fetchRejectedRequests(page = this.pagination.currentPage, size = this.pagination.size) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('size', size);
        params.append('sort', `${this.sort.field},${this.sort.direction}`);

        if (this.filters.errorType) params.append('errorType', this.filters.errorType);
        if (this.filters.barcode) params.append('barcode', this.filters.barcode);
        if (this.filters.dateFrom) params.append('dateFrom', this.filters.dateFrom);
        if (this.filters.dateTo) params.append('dateTo', this.filters.dateTo);

        const response = await apiClient.get(`/processing-errors?${params.toString()}`);
        if (response.data && response.data.content) {
            if (page === 0) {
                this.rejectedRequests = response.data.content;
            } else {
                this.rejectedRequests = [...this.rejectedRequests, ...response.data.content];
            }
            this.pagination.currentPage = response.data.number;
            this.pagination.totalPages = response.data.totalPages;
            this.pagination.totalElements = response.data.totalElements;
            this.pagination.size = response.data.size;
        } else {
            this.rejectedRequests = [];
            this.pagination = { currentPage: 0, totalPages: 0, totalElements: 0, size: this.pagination.size };
        }
      } catch (error) {
        console.error('Błąd podczas pobierania odrzuconych żądań:', error.response?.data || error.message);
        this.rejectedRequests = [];
        this.pagination = { currentPage: 0, totalPages: 0, totalElements: 0, size: this.pagination.size };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchErrorDetails(errorId) {
      this.isLoading = true;
      this.selectedRequestDetails = null;
      try {
        const response = await apiClient.get(`/processing-errors/${errorId}`);
        this.selectedRequestDetails = response.data;
      } catch (error) {
        console.error(`Błąd podczas pobierania szczegółów błędu ${errorId}:`, error.response?.data || error.message);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async resubmitRequest(payload) {
      this.isLoading = true;
      try {
        const response = await apiClient.post('/processing-errors/resubmit', payload);
        await this.fetchRejectedRequests(this.pagination.currentPage, this.pagination.size);
        return Promise.resolve(response.data?.message || "Żądanie zostało pomyślnie przesłane ponownie.");
      } catch (error) {
        console.error('Błąd podczas ponownego przesyłania żądania:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data || 'Nie udało się ponownie przesłać żądania.');
      } finally {
        this.isLoading = false;
      }
    },

    async sendVerificationEmailToCustomer(errorEventId) {
        if (!errorEventId) {
            throw new Error("EventID błędu jest wymagany do wysłania emaila.");
        }
        this.isLoading = true;
        try {
            const response = await apiClient.post(`/admin/address-verification/error/${errorEventId}/send-verification-email`);
            await this.fetchRejectedRequests(this.pagination.currentPage);
            if (this.selectedRequestDetails && this.selectedRequestDetails.eventId === errorEventId) {
            }
            return Promise.resolve(response.data?.message || "Proces wysyłania emaila weryfikacyjnego został zainicjowany.");
        } catch (error) {
            console.error(`Błąd podczas inicjowania wysyłki emaila weryfikacyjnego dla błędu ${errorEventId}:`, error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Nie udało się zainicjować wysyłki emaila weryfikacyjnego.';
            throw new Error(errorMessage);
        } finally {
            this.isLoading = false;
        }
    },

    setFilter(filterName, value) {
      if (this.filters.hasOwnProperty(filterName)) {
        this.filters[filterName] = value;
        this.fetchRejectedRequests(0);
      }
    },
    setSort(field, direction) {
      this.sort.field = field;
      this.sort.direction = direction;
      this.fetchRejectedRequests(0);
    }
  }
})
import { defineStore } from 'pinia';
import apiClient from '@/services/api';

export const useAddressUploadStore = defineStore('addressUpload', {
  state: () => ({
    jobs: {}, // Będzie przechowywać statusy zadań, np. { 'jobId': { status: 'PROCESSING', ... } }
    isLoading: false,
    error: null,
  }),
  getters: {
    // Getter do pobierania zadań jako posortowana lista (najnowsze pierwsze)
    jobList: (state) => {
      return Object.values(state.jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  actions: {
    async uploadFile(file) {
      if (!file) {
        this.error = 'No file selected.';
        return;
      }
      this.isLoading = true;
      this.error = null;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await apiClient.post('/api/address-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const { jobId } = response.data;
        if (jobId) {
          // Inicjalizuj status zadania i zacznij go śledzić
          this.jobs[jobId] = {
            jobId,
            originalFilename: file.name,
            status: 'PENDING',
            progress: 0,
            createdAt: new Date().toISOString()
          };
          this.pollJobStatus(jobId);
        }
      } catch (err) {
        console.error('File upload failed:', err);
        this.error = err.response?.data?.error || 'File upload failed.';
      } finally {
        this.isLoading = false;
      }
    },

    async pollJobStatus(jobId) {
      const intervalId = setInterval(async () => {
        try {
          const response = await apiClient.get(`/api/address-upload/jobs/${jobId}`);
          const jobData = response.data;
          
          // Aktualizuj status zadania w store
          this.jobs[jobId] = { ...this.jobs[jobId], ...jobData };

          // Zatrzymaj śledzenie, jeśli status jest końcowy
          if (['COMPLETED', 'FAILED_WITH_ERRORS'].includes(jobData.status)) {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error(`Failed to fetch status for job ${jobId}:`, error);
          this.jobs[jobId].status = 'POLLING_ERROR';
          this.jobs[jobId].errorDetails = 'Could not fetch job status.';
          clearInterval(intervalId);
        }
      }, 3000); // Sprawdzaj status co 3 sekundy
    },
  },
});
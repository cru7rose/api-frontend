import { defineStore } from 'pinia';
import apiClient from '@/services/api.js'; // Using your existing API client [cite: 26, 30]

export const useInvoicingRulesStore = defineStore('invoicingRules', {
  state: () => ({
    hubRules: [],
    isLoading: false,
    error: null,
  }),
  getters: {
    // A getter to return rules, perhaps sorted by HUB name
    sortedHubRules: (state) => {
      return [...state.hubRules].sort((a, b) => a.hubId.localeCompare(b.hubId));
    },
  },
  actions: {
    async fetchHubRules() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/api/admin/invoicing-rules?ruleType=INTERIOR');
        this.hubRules = response.data;
      } catch (err) {
        this.error = 'Failed to fetch HUB rules.';
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async saveRule(rule) {
      this.isLoading = true;
      this.error = null;
      try {
        if (rule.id) {
          // Update existing rule
          await apiClient.put(`/api/admin/invoicing-rules/${rule.id}`, rule);
        } else {
          // Create new rule
          await apiClient.post('/api/admin/invoicing-rules', rule);
        }
        // Refresh the list after saving
        await this.fetchHubRules();
      } catch (err) {
        this.error = 'Failed to save rule.';
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRule(ruleId) {
      this.isLoading = true;
      this.error = null;
      try {
        await apiClient.delete(`/api/admin/invoicing-rules/${ruleId}`);
        // Refresh the list after deleting
        await this.fetchHubRules();
      } catch (err) {
        this.error = 'Failed to delete rule.';
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
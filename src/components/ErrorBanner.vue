<script setup>
import { ErrorBannerViewModel } from "@/viewmodels/ErrorBannerViewModel.js";
import { computed } from 'vue';

const props = defineProps({
  error: [String, Object, Error],
  class: String
});

const viewModel = computed(() => {
  if (!props.error) return null;
  return new ErrorBannerViewModel(props.error).toObject();
});
</script>

<template>
  <div v-if="viewModel" :class="props.class" class="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg flex items-center">
    <span class="font-bold mr-2">Error: {{ viewModel.title }}</span>
    <span class="text-sm">{{ viewModel.detail }}</span>
  </div>
</template>

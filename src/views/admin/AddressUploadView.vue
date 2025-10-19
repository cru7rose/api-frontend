<script setup>
import { ref } from 'vue';
import { useAddressUploadStore } from '@/stores/addressUploadStore';

const uploadStore = useAddressUploadStore();
const selectedFile = ref(null);
const fileInput = ref(null);

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
};

const handleUpload = () => {
  if (selectedFile.value) {
    uploadStore.uploadFile(selectedFile.value);
    selectedFile.value = null; 
    fileInput.value.value = '';
  }
};

const getStatusClass = (status) => {
    switch(status) {
        case 'COMPLETED': return 'text-green-600';
        case 'PENDING': return 'text-yellow-600';
        case 'PROCESSING': return 'text-blue-600';
        case 'FAILED_WITH_ERRORS': return 'text-red-600';
        case 'POLLING_ERROR': return 'text-red-800';
        default: return 'text-gray-600';
    }
};
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md space-y-8">
    <h1 class="text-2xl font-bold text-gray-800">Address File Upload</h1>

    <div class="border border-gray-200 p-4 rounded-lg">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Upload New File</h2>
      <div class="flex items-center space-x-4">
        <input type="file" @change="handleFileChange" ref="fileInput" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <button @click="handleUpload" :disabled="!selectedFile || uploadStore.isLoading" class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed">
          {{ uploadStore.isLoading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
      <div v-if="uploadStore.error" class="text-red-600 mt-2 text-sm">{{ uploadStore.error }}</div>
    </div>

    <div class="border border-gray-200 p-4 rounded-lg">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Upload History</h2>
      <div v-if="uploadStore.jobList.length === 0" class="text-gray-500">No upload jobs found.</div>
      <div v-else class="space-y-4">
        <div v-for="job in uploadStore.jobList" :key="job.jobId" class="bg-gray-50 p-4 rounded-md">
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-800">{{ job.originalFilename }}</p>
                    <p class="text-sm text-gray-500">Job ID: {{ job.jobId }}</p>
                    <p class="text-sm text-gray-500">Started at: {{ new Date(job.createdAt).toLocaleString() }}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold" :class="getStatusClass(job.status)">{{ job.status }}</p>
                    <p v-if="job.status === 'PROCESSING'" class="text-sm">{{ job.progress }}%</p>
                    <p v-if="job.errorDetails" class="text-sm text-red-600">{{ job.errorDetails }}</p>
                </div>
            </div>
            <div v-if="job.status === 'PROCESSING'" class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: job.progress + '%' }"></div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
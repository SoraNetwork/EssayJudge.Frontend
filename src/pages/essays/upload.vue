<template>
  <div>
    <h1 class="text-h4 mb-4">上传作文并批改</h1>

    <v-card v-if="!isUploading && !isPolling">
      <v-card-text>
        <v-form @submit.prevent="uploadEssay">
          <v-select
            v-model="selectedAssignment"
            :items="assignments"
            item-title="title"
            item-value="id"
            label="选择测验"
            required
          ></v-select>
          <v-file-input
            v-model="selectedFile"
            label="选择作文图片"
            accept="image/*"
            required
          ></v-file-input>
          <v-text-field
            v-model.number="columnCount"
            label="分栏数"
            type="number"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary" :loading="isSubmitting">提交</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <div v-if="isPolling">
      <v-card class="mb-4">
        <v-card-text class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">正在批改中，请稍候...</p>
          <p>状态: {{ pollingStatus.status }}</p>
        </v-card-text>
      </v-card>

      <v-card v-if="pollingStatus.originalText" class="mb-4">
        <v-card-title>识别原文</v-card-title>
        <v-card-text class="pre-wrap">{{ pollingStatus.originalText }}</v-card-text>
      </v-card>

      <v-card v-if="pollingStatus.aiResults && pollingStatus.aiResults.length > 0" class="mb-4">
        <v-card-title>AI 初步批改</v-card-title>
        <v-card-text>
          <ul>
            <li v-for="result in pollingStatus.aiResults" :key="result.id">
              <strong>{{ result.modelName }}:</strong> {{ result.feedback }} (得分: {{ result.score }})
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();

const assignments = ref([]);
const selectedAssignment = ref(null);
const selectedFile = ref<File | null>(null);
const columnCount = ref(3);
const isSubmitting = ref(false);
const isUploading = ref(false);
const isPolling = ref(false);
const pollingStatus = ref<any>({});

async function fetchAssignments() {
  try {
    const response = await api.get('/EssayAssignment');
    assignments.value = response.data || [];
  } catch (error) {
    console.error('获取测验列表失败:', error);
  }
}

async function uploadEssay() {
  if (!selectedAssignment.value || !selectedFile.value) {
    return;
  }

  isSubmitting.value = true;
  isUploading.value = true;

  const formData = new FormData();
  formData.append('essayAssignmentId', selectedAssignment.value);
  formData.append('imageFile', selectedFile.value);
  formData.append('columnCount', columnCount.value.toString());

  try {
    const response = await api.post('/EssaySubmission', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const submissionId = response.data.submissionId;
    startPolling(submissionId);
  } catch (error) {
    console.error('上传作文失败:', error);
  } finally {
    isSubmitting.value = false;
  }
}

function startPolling(submissionId: string) {
  isUploading.value = false;
  isPolling.value = true;
  const interval = setInterval(async () => {
    try {
      const response = await api.get(`/EssaySubmission/${submissionId}`);
      pollingStatus.value = response.data;
      if (response.data.judgeResult) {
        clearInterval(interval);
        router.push(`/essays/${submissionId}`);
      }
    } catch (error) {
      console.error('轮询失败:', error);
      clearInterval(interval);
      isPolling.value = false; // Stop polling on error
    }
  }, 2000);
}

onMounted(() => {
  fetchAssignments();
});
</script>

<style scoped>
.pre-wrap {
  white-space: pre-wrap;
}
</style>
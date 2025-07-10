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
            label="选择作文图片（支持拖动文件到此处选择）"
            accept="image/*"
            required
          ></v-file-input>
          <v-text-field
            v-model.number="columnCount"
            label="分栏数"
            type="number"
            required
          ></v-text-field>
          <div class="d-flex justify-end">
            <v-btn type="submit" color="primary" :loading="isSubmitting" class="mr-2">提交</v-btn>
            <v-btn color="secondary" to="/essays/upload_multiple" prepend-icon="mdi-upload-multiple">批量上传</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <div v-if="isPolling">
      <!-- 线性进度条 -->
      <v-progress-linear
        :model-value="pollingProgress"
        color="primary"
        height="8"
        striped
        class="mb-4"
      ></v-progress-linear>

      <v-card class="mb-4">
        <v-card-text class="text-center">
          <!-- 循环进度指示器，移除文本 -->
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">正在批改中，请稍候...</p>
          <p>状态: {{ pollingStatus.status }}</p>
        </v-card-text>
      </v-card>

      <v-card v-if="pollingStatus.parsedText" class="mb-4">
        <v-card-title>识别原文</v-card-title>
        <v-card-text class="pre-wrap">{{ pollingStatus.parsedText}}</v-card-text>
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
import { getAssignments, uploadEssaySubmission, getSubmissionById, type Assignment } from '@/services/apiService';

const router = useRouter();

// Define the type for an assignment
// interface Assignment {
//   id: string; // Assuming id is a number based on item-value="id"
//   title: string; // Assuming title is a string based on item-title="title"
//   // Add other properties if necessary
// }

const assignments = ref<Assignment[]>([]);
const selectedAssignment = ref<string | null>(null); // Assuming assignment id is a number
const selectedFile = ref<File | null>(null);
const columnCount = ref(3);
const isSubmitting = ref(false);
const isUploading = ref(false);
const isPolling = ref(false);
const pollingStatus = ref<any>({});
const pollingProgress = ref(0); // 新增进度变量

async function fetchAssignments() {
  try {
    // Replace api.get with getAssignments
    const data = await getAssignments();
    assignments.value = data || [];
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
  pollingProgress.value = 0; // 重置进度

  try {
    // Replace api.post with uploadEssaySubmission
    const response = await uploadEssaySubmission(
      selectedAssignment.value,
      selectedFile.value,
      columnCount.value
    );
    const submissionId = response.submissionId;
    startPolling(submissionId);
  } catch (error) {
    console.error('上传作文失败:', error);
    isPolling.value = false; // 停止轮询
    pollingProgress.value = 0; // 错误时重置进度
  } finally {
    isSubmitting.value = false;
  }
}

function startPolling(submissionId: string) {
  isUploading.value = false;
  isPolling.value = true;
  pollingProgress.value = 0; // 开始轮询时进度为0

  const interval = setInterval(async () => {
    try {
      // Replace api.get with getSubmissionById
      const submissionData = await getSubmissionById(submissionId);
      pollingStatus.value = submissionData;

      // 更新进度
      let progress = 0;
      if (pollingStatus.value.parsedText) {
        progress += 20; // 识别原文完成
      }
      if (pollingStatus.value.aiResults && pollingStatus.value.aiResults.length > 0) {
        // 每个AI结果增加20%，最多4个AI结果
        progress += Math.min(pollingStatus.value.aiResults.length, 4) * 20;
      }
      pollingProgress.value = Math.min(progress, 100); // 确保进度不超过100

      if (submissionData.judgeResult) {
        clearInterval(interval);
        pollingProgress.value = 100; // 批改完成，进度100%
        // 延迟跳转，让用户看到100%进度
        setTimeout(() => {
          router.push(`/essays/${submissionId}`);
        }, 500); // 延迟0.5秒
      }
    } catch (error) {
      console.error('轮询失败:', error);
      clearInterval(interval);
      isPolling.value = false; // Stop polling on error
      pollingStatus.value = {}; // 清空状态
      pollingProgress.value = 0; // 错误时重置进度
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
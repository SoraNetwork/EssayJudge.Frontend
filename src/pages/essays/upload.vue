<template>
  <div>
    <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">上传作文并批改</h1>

    <a-card v-if="!isUploading && !isPolling">
      <a-form @submit.prevent="uploadEssay" layout="vertical">
        <a-form-item label="选择测验" required>
          <a-select
            v-model:value="selectedAssignment"
            :options="assignmentOptions"
            placeholder="请选择测验"
          />
        </a-form-item>
        <a-form-item label="选择作文图片（支持拖动文件到此处选择）" required>
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :max-count="1"
            accept="image/*"
            list-type="picture-card"
            :custom-request="() => {}"
          >
            <div v-if="fileList.length === 0">
              <PlusOutlined />
              <div style="margin-top: 8px">上传图片</div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="分栏数" required>
          <a-input-number
            v-model:value="columnCount"
            :min="1"
            :max="10"
            style="width: 100%"
          />
        </a-form-item>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px;">
          <a-switch v-model:checked="enableV3" checked-children="启用 V3 OCR方式" un-checked-children="禁用 V3 OCR方式" />
          <a-button type="primary" html-type="submit" :loading="isSubmitting">提交</a-button>
          <a-button href="/essays/upload_multiple">
            <template #icon><UploadOutlined /></template>
            批量上传
          </a-button>
        </div>
      </a-form>
    </a-card>

    <div v-if="isPolling">
      <!-- 线性进度条 -->
      <a-progress
        :percent="pollingProgress"
        status="active"
        style="margin-bottom: 16px;"
      />

      <a-card style="margin-bottom: 16px;">
        <div style="text-align: center;">
          <a-spin size="large" />
          <p style="margin-top: 16px;">正在批改中，请稍候...</p>
          <p>状态: {{ pollingStatus.status }}</p>
        </div>
      </a-card>

      <a-card v-if="pollingStatus.parsedText" style="margin-bottom: 16px;">
        <template #title>识别原文</template>
        <div style="white-space: pre-wrap; word-wrap: break-word;">{{ pollingStatus.parsedText }}</div>
      </a-card>

      <a-card v-if="pollingStatus.aiResults && pollingStatus.aiResults.length > 0" style="margin-bottom: 16px;">
        <template #title>AI 初步批改</template>
        <ul>
          <li v-for="result in pollingStatus.aiResults" :key="result.id">
            <strong>{{ result.modelName }}:</strong> {{ result.feedback }} (得分: {{ result.score }})
          </li>
        </ul>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { getAssignments, uploadEssaySubmission, getSubmissionById, type Assignment } from '@/services/apiService';
import type { UploadProps } from 'ant-design-vue';

const router = useRouter();

// Helper function to format date
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = new Date(dateString);
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options);
}

const assignments = ref<Assignment[]>([]);
const selectedAssignment = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const fileList = ref<any[]>([]);
const columnCount = ref(3);
const isSubmitting = ref(false);
const isUploading = ref(false);
const isPolling = ref(false);
const enableV3 = ref(false);
const pollingStatus = ref<any>({});
const pollingProgress = ref(0);

// Assignment options for select
const assignmentOptions = computed(() => {
  return assignments.value.map(item => ({
    value: item.id,
    label: item.description || item.titleContext || item.id,
    createdAt: item.createdAt
  }))
})

async function fetchAssignments() {
  try {
    const data = await getAssignments();
    assignments.value = data || [];
  } catch (error) {
    console.error('获取测验列表失败:', error);
  }
}

// Handle file upload
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  selectedFile.value = file;
  fileList.value = [file];
  return false; // Prevent automatic upload
};

async function uploadEssay() {
  if (!selectedAssignment.value || !selectedFile.value) {
    return;
  }

  isSubmitting.value = true;
  isUploading.value = true;
  pollingProgress.value = 0;

  try {
    const response = await uploadEssaySubmission(
      selectedAssignment.value,
      selectedFile.value,
      columnCount.value,
      enableV3.value
    );
    const submissionId = response.submissionId;
    startPolling(submissionId);
  } catch (error) {
    console.error('上传作文失败:', error);
    isPolling.value = false;
    pollingProgress.value = 0;
  } finally {
    isSubmitting.value = false;
  }
}

function startPolling(submissionId: string) {
  isUploading.value = false;
  isPolling.value = true;
  pollingProgress.value = 0;

  const interval = setInterval(async () => {
    try {
      const submissionData = await getSubmissionById(submissionId);
      pollingStatus.value = submissionData;

      let progress = 0;
      if (pollingStatus.value.parsedText) {
        progress += 20;
      }
      if (pollingStatus.value.aiResults && pollingStatus.value.aiResults.length > 0) {
        progress += Math.min(pollingStatus.value.aiResults.length, 4) * 20;
      }
      pollingProgress.value = Math.min(progress, 100);

      if (submissionData.judgeResult) {
        clearInterval(interval);
        pollingProgress.value = 100;
        setTimeout(() => {
          router.push(`/essays/${submissionId}`);
        }, 500);
      }
    } catch (error) {
      console.error('轮询失败:', error);
      clearInterval(interval);
      isPolling.value = false;
      pollingStatus.value = {};
      pollingProgress.value = 0;
    }
  }, 2000);
}

onMounted(() => {
  fetchAssignments();
});
</script>
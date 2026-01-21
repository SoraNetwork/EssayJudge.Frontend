<template>
  <div>
    <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">上传作文并批改</h1>

    <!-- Upload Form -->
    <a-card v-if="viewState === 'form'">
      <a-form @submit.prevent="uploadEssay" layout="vertical">
        <a-form-item label="选择测验" required>
          <a-select
            v-model:value="selectedAssignment"
            :options="assignmentOptions"
            placeholder="请选择测验"
          />
        </a-form-item>
        <a-form-item label="选择作文图片（支持拖动文件到此处选择）" required>
          <div
            class="drag-file-area"
            @dragover.prevent
            @dragleave.prevent
            @drop.prevent="onDropFile"
          >
            <a-upload
              v-model:file-list="fileList"
              :before-upload="beforeUpload"
              :max-count="maxFiles"
              accept="image/*"
              list-type="picture-card"
              :custom-request="() => {}"
              multiple
              @click.stop
            >
              <div v-if="fileList.length === 0">
                <PlusOutlined />
                <div style="margin-top: 8px">上传图片</div>
              </div>
              <div v-else>
                <PlusOutlined />
                <div style="margin-top: 8px">添加更多</div>
              </div>
            </a-upload>
            <div style="text-align: center; margin-top: 8px; color: #999;">
              支持拖动文件到此处选择，最多 {{ maxFiles }} 篇
            </div>
          </div>
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
        </div>
      </a-form>
    </a-card>

    <!-- Single File Polling View -->
    <div v-if="viewState === 'single_polling'">
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

    <!-- Batch Processing View -->
    <div v-if="viewState === 'batch_polling'">
      <a-progress
        :percent="overallProgress"
        status="active"
        style="margin-bottom: 16px;"
      />

      <a-card>
        <template #title>批量批改进度</template>
        <a-list :data-source="processingFiles" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>{{ item.file.name }}</template>
                <template #description>
                  状态: {{ getProcessingStatusText(item.status) }}
                  <span v-if="item.status === 'completed'"> - 得分: {{ item.finalScore ?? 'N/A' }}</span>
                  <span v-if="item.status === 'error'" style="color: #ff4d4f;"> - 错误: {{ item.error ?? '未知错误' }}</span>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-spin v-if="item.status === 'uploading' || item.status === 'polling'" size="small" />
                <CheckCircleOutlined v-else-if="item.status === 'completed'" style="color: #52c41a;" />
                <ExclamationCircleOutlined v-else-if="item.status === 'error'" style="color: #ff4d4f;" />
                <EllipsisOutlined v-else />
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </div>

    <!-- Completion Dialog -->
    <a-modal
      v-model:open="completionDialog"
      title="批改完成"
      :closable="false"
      :maskClosable="false"
      width="300px"
    >
      <p>{{ completionMessage }}</p>
      <template #footer>
        <a-button type="primary" @click="completionDialog = false; router.push('/essays')">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { UploadOutlined, PlusOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EllipsisOutlined } from '@ant-design/icons-vue';
import { getAssignments, uploadEssaySubmission, uploadEssayBatchSubmission, getSubmissionById, type Assignment } from '@/services/apiService';
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
const selectedFiles = ref<File[] | null>(null);
const fileList = ref<any[]>([]);
const columnCount = ref(3);
const isSubmitting = ref(false);
const enableV3 = ref(false);

// View state: 'form', 'single_polling', 'batch_polling'
const viewState = ref<'form' | 'single_polling' | 'batch_polling'>('form');

// Single file polling state
const pollingStatus = ref<any>({});
const pollingProgress = ref(0);

// Batch processing state
const processingFiles = ref<Array<{
  file: File,
  status: 'pending' | 'uploading' | 'polling' | 'completed' | 'error',
  submissionId?: string,
  finalScore?: number,
  error?: string,
}>>([]);
const overallProgress = ref(0);

// Batch processing configuration
const maxFiles = 60;
const batchSize = 3;
const batchDelay = 5000;

let currentFileIndex = 0;

// 用于存储每个文件的轮询定时器
const pollingIntervals = new Map<string, number | null>();
// 用于存储下一个批次处理的定时器 ID
let batchTimeoutId: number | null = null;

// 完成对话框状态
const completionDialog = ref(false);
const completionMessage = ref('');

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

// 监听 fileList 变化，同步更新 selectedFiles
watch(fileList, (newFileList) => {
  // 从 fileList 中提取 originFileObj（实际的 File 对象）
  selectedFiles.value = newFileList
    .filter(item => item.originFileObj && item.status !== 'removed')
    .map(item => item.originFileObj);
}, { deep: true });

// Handle file upload
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 返回 false 阻止自动上传，让 fileList 自动管理
  return false;
};

async function uploadEssay() {
  if (!selectedAssignment.value || !selectedFiles.value || selectedFiles.value.length === 0) {
    return;
  }

  if (selectedFiles.value.length > maxFiles) {
    alert(`每次最多上传${maxFiles}篇作文`);
    return;
  }

  isSubmitting.value = true;

  try {
    // 根据文件数量选择使用单文件上传还是批量上传
    if (selectedFiles.value.length === 1) {
      await uploadSingleEssay();
    } else {
      await uploadBatchEssays();
    }
  } catch (error) {
    console.error('上传作文失败:', error);
    viewState.value = 'form';
  } finally {
    isSubmitting.value = false;
  }
}

// 单文件上传逻辑
async function uploadSingleEssay() {
  const file = selectedFiles.value![0];
  viewState.value = 'single_polling';
  pollingProgress.value = 0;

  const response = await uploadEssaySubmission(
    selectedAssignment.value!,
    file,
    columnCount.value,
    enableV3.value
  );
  const submissionId = response.submissionId;
  startSinglePolling(submissionId);
}

function startSinglePolling(submissionId: string) {
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
      viewState.value = 'form';
      pollingStatus.value = {};
      pollingProgress.value = 0;
    }
  }, 2000);
}

// 批量上传逻辑
async function uploadBatchEssays() {
  viewState.value = 'batch_polling';
  overallProgress.value = 0;
  clearAllTimers();

  const files = selectedFiles.value!;
  const response = await uploadEssayBatchSubmission(selectedAssignment.value!, files, columnCount.value, enableV3.value);
  const ids = response.submissionIds || [];
  processingFiles.value = ids.map((id, idx) => ({
    file: files[idx],
    status: 'polling',
    submissionId: id
  }));
  currentFileIndex = 0;
  processPollingBatch();
}

// 分批轮询批改结果
function processPollingBatch() {
  if (currentFileIndex >= processingFiles.value.length) {
    return;
  }
  const endIndex = Math.min(currentFileIndex + batchSize, processingFiles.value.length);
  for (let i = currentFileIndex; i < endIndex; i++) {
    startPollingForFile(processingFiles.value[i]);
  }
  currentFileIndex = endIndex;
  if (currentFileIndex < processingFiles.value.length) {
    batchTimeoutId = setTimeout(processPollingBatch, batchDelay) as any;
  }
}

function startPollingForFile(item: typeof processingFiles.value[0]) {
  if (!item.submissionId) {
    console.error(`无法为文件 ${item.file.name} 启动轮询：缺少 submissionId`);
    return;
  }
  if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
    clearInterval(pollingIntervals.get(item.submissionId)!);
  }

  const interval = setInterval(() => checkPollingStatusForFile(item), 2000) as any;
  pollingIntervals.set(item.submissionId, interval);
}

async function checkPollingStatusForFile(item: typeof processingFiles.value[0]) {
  if (!item.submissionId || item.status !== 'polling') {
    if (item.submissionId && pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
      clearInterval(pollingIntervals.get(item.submissionId)!);
      pollingIntervals.delete(item.submissionId);
    }
    return;
  }

  try {
    const submissionData = await getSubmissionById(item.submissionId);
    if (submissionData.judgeResult) {
      item.status = 'completed';
      item.finalScore = submissionData.finalScore;

      if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
        clearInterval(pollingIntervals.get(item.submissionId)!);
        pollingIntervals.delete(item.submissionId);
      }

      calculateOverallProgress();
      checkOverallCompletion();
    }
  } catch (error: any) {
    console.error(`轮询提交 ${item.submissionId} 失败:`, error);
    item.status = 'error';
    item.error = error.response?.data?.message || '处理失败';

    if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
      clearInterval(pollingIntervals.get(item.submissionId)!);
      pollingIntervals.delete(item.submissionId);
    }

    calculateOverallProgress();
    checkOverallCompletion();
  }
}

function calculateOverallProgress() {
  const totalFiles = processingFiles.value.length;
  if (totalFiles === 0) {
    overallProgress.value = 0;
    return;
  }
  const completedOrErroredCount = processingFiles.value.filter(item => item.status === 'completed' || item.status === 'error').length;
  overallProgress.value = Math.min((completedOrErroredCount / totalFiles) * 100, 100);
}

function checkOverallCompletion() {
  const totalFiles = processingFiles.value.length;
  if (totalFiles === 0) return;

  const completedOrErroredCount = processingFiles.value.filter(item => item.status === 'completed' || item.status === 'error').length;

  if (completedOrErroredCount === totalFiles) {
    calculateOverallProgress();
    completionMessage.value = '全部批改完成！';
    completionDialog.value = true;

    if (batchTimeoutId !== null) {
      clearTimeout(batchTimeoutId);
      batchTimeoutId = null;
    }

    setTimeout(() => {
      completionDialog.value = false;
      router.push('/essays');
    }, 5000);
  }
}

function getProcessingStatusText(status: string) {
  switch (status) {
    case 'pending': return '等待上传';
    case 'uploading': return '上传中';
    case 'polling': return '处理中';
    case 'completed': return '已完成';
    case 'error': return '失败';
    default: return status;
  }
}

// 拖拽逻辑
function onDropFile(e: DragEvent) {
  e.preventDefault();

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const newFiles = Array.from(e.dataTransfer.files);
    const currentFileList = [...fileList.value];
    const combinedFiles = [...currentFileList, ...newFiles.map(f => ({
      uid: Math.random().toString(),
      name: f.name,
      status: 'done' as const,
      url: URL.createObjectURL(f),
      originFileObj: f
    }))];

    if (combinedFiles.length > maxFiles) {
      alert(`文件总数不能超过 ${maxFiles} 篇。已自动选择前 ${maxFiles} 篇文件。`);
      fileList.value = combinedFiles.slice(0, maxFiles);
    } else {
      fileList.value = combinedFiles;
    }
  }
}

function clearAllTimers() {
  pollingIntervals.forEach((intervalId, submissionId) => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });
  pollingIntervals.clear();

  if (batchTimeoutId !== null) {
    clearTimeout(batchTimeoutId);
    batchTimeoutId = null;
  }
}

onMounted(() => {
  fetchAssignments();
});

onUnmounted(() => {
  clearAllTimers();
});
</script>

<style scoped>
.pre-wrap {
  white-space: pre-wrap;
}

.drag-file-area {
  position: relative;
  border: 2px dashed #ccc;
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 16px;
  padding: 16px;
}

.drag-file-area:hover {
  border-color: #1890ff;
  background-color: #f5f5f5;
}
</style>
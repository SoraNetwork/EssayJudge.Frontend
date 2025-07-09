<template>
  <div>
    <h1 class="text-h4 mb-4">批量上传作文并批改</h1>

    <!-- Upload Form -->
    <v-card v-if="viewState === 'form'">
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
          <!-- 支持拖拽的文件输入 -->
          <div
            class="drag-file-area"
            @dragover.prevent
            @dragleave.prevent
            @drop.prevent="onDropFile"
          >
            <v-file-input
              v-model="selectedFiles"
              label="选择作文图片（支持拖动文件到此处选择，最多20篇）"
              accept="image/*"
              required
              multiple
              :max-files="maxFiles"
              show-size
              prepend-icon="mdi-upload"
              style="background: transparent"
              @click.stop
            ></v-file-input>
          </div>
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

    <!-- Processing View -->
    <div v-if="viewState === 'processing'">
      <!-- 线性进度条 -->
      <v-progress-linear
        :model-value="overallProgress"
        color="primary"
        height="8"
        striped
        class="mb-4"
      ></v-progress-linear>

      <v-card>
        <v-card-title>批量批改进度</v-card-title>
        <v-card-text>
          <v-list dense>
            <v-list-item v-for="(item, index) in processingFiles" :key="index">
              <v-list-item-content>
                <v-list-item-title>{{ item.file.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  状态: {{ getProcessingStatusText(item.status) }}
                  <span v-if="item.status === 'completed'"> - 得分: {{ item.finalScore ?? 'N/A' }}</span>
                  <span v-if="item.status === 'error'" class="text-error"> - 错误: {{ item.error ?? '未知错误' }}</span>
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-progress-circular
                  v-if="item.status === 'uploading' || item.status === 'polling'"
                  indeterminate
                  size="24"
                  width="3"
                  color="primary"
                ></v-progress-circular>
                <v-icon v-else-if="item.status === 'completed'" color="success">mdi-check-circle</v-icon>
                <v-icon v-else-if="item.status === 'error'" color="error">mdi-alert-circle</v-icon>
                <v-icon v-else>mdi-dots-horizontal</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>

    <!-- Completion Dialog -->
    <v-dialog v-model="completionDialog" persistent max-width="300">
      <v-card>
        <v-card-title class="text-h6">批改完成</v-card-title>
        <v-card-text>{{ completionMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="completionDialog = false; router.push('/essays')">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getAssignments, uploadEssaySubmission, getSubmissionById, type Assignment } from '@/services/apiService';

const router = useRouter();

const assignments = ref<Assignment[]>([]);
const selectedAssignment = ref(null);
const selectedFiles = ref<File[] | null>(null); // Change to array for multiple files
const columnCount = ref(3);
const isSubmitting = ref(false);

// State for managing view and processing
const viewState = ref<'form' | 'processing'>('form');
const processingFiles = ref<Array<{
  file: File,
  status: 'pending' | 'uploading' | 'polling' | 'completed' | 'error',
  submissionId?: string,
  finalScore?: number,
  error?: string,
}>>([]);
const overallProgress = ref(0); // Overall batch progress (0-100)
const pollingIntervalId = ref<number | null>(null); // To store the interval ID for the current file

// Completion Dialog State
const completionDialog = ref(false);
const completionMessage = ref('');

// Batch processing configuration
const maxFiles = 20; // Maximum files allowed in total
let currentFileIndex = 0; // Index to track the file currently being processed

async function fetchAssignments() {
  try {
    const data = await getAssignments();
    assignments.value = data || [];
  } catch (error) {
    console.error('获取测验列表失败:', error);
  }
}

async function uploadEssay() {
  if (!selectedAssignment.value || !selectedFiles.value || selectedFiles.value.length === 0) {
    // Maybe show a message if validation fails
    return;
  }

  // Enforce max files (redundant with v-file-input prop, but good fallback)
  if (selectedFiles.value.length > maxFiles) {
     alert(`每次最多上传${maxFiles}篇作文`); // Or use a snackbar/toast
     return;
  }

  // Reset state and switch view
  isSubmitting.value = true;
  viewState.value = 'processing';
  overallProgress.value = 0;
  currentFileIndex = 0; // Reset file index
  processingFiles.value = selectedFiles.value.map(file => ({ file: file, status: 'pending' }));

  // Stop any existing polling interval
  if (pollingIntervalId.value !== null) {
    clearInterval(pollingIntervalId.value);
    pollingIntervalId.value = null;
  }

  // Start processing the first file
  await processFileAtIndex(currentFileIndex);

  isSubmitting.value = false; // Submitting is done once uploads are initiated
}

async function processFileAtIndex(index: number) {
    // Check if all files are processed
    if (index >= processingFiles.value.length) {
        calculateOverallProgress(); // Ensure final progress is 100%
        // Show completion dialog and redirect
        completionMessage.value = '全部批改完成！';
        completionDialog.value = true;

        // Auto-close dialog and redirect after 5 seconds
        setTimeout(() => {
          completionDialog.value = false;
          router.push('/essays');
        }, 5000); // 5 seconds delay
        return; // Stop processing
    }

    currentFileIndex = index; // Update current index
    const item = processingFiles.value[index];
    item.status = 'uploading';

    const formData = new FormData();
    formData.append('essayAssignmentId', selectedAssignment.value!);
    formData.append('imageFile', item.file);
    formData.append('columnCount', columnCount.value.toString());

    try {
      const response = await uploadEssaySubmission(
        selectedAssignment.value!,
        item.file,
        columnCount.value
      );
      item.submissionId = response.submissionId;
      item.status = 'polling';
      // Start polling for this specific file
      startPollingForFile(item);
    } catch (error: any) {
      console.error(`上传文件 ${item.file.name} 失败:`, error);
      item.status = 'error';
      item.error = error.response?.data?.message || '上传失败';
      calculateOverallProgress(); // Update progress on error
      // Immediately move to the next file if upload fails
      await processFileAtIndex(currentFileIndex + 1);
    }
}


function startPollingForFile(item: typeof processingFiles.value[0]) {
  // Clear any existing interval before starting a new one
  if (pollingIntervalId.value !== null) {
    clearInterval(pollingIntervalId.value);
  }
  // Start polling for the specific item
  pollingIntervalId.value = setInterval(() => checkPollingStatusForFile(item), 2000) as any;
}

async function checkPollingStatusForFile(item: typeof processingFiles.value[0]) {
  // Find the item in the reactive array to ensure updates are reflected
  const reactiveItem = processingFiles.value.find(f => f.submissionId === item.submissionId);

  if (!reactiveItem || reactiveItem.status !== 'polling' || !reactiveItem.submissionId) {
      // Should not happen if called correctly, but as a safeguard
      if (pollingIntervalId.value !== null) {
        clearInterval(pollingIntervalId.value);
        pollingIntervalId.value = null;
      }
      return;
  }

  try {
    const submissionData = await getSubmissionById(reactiveItem.submissionId);
    // Check if processing is complete (judgeResult is available)
    if (submissionData.judgeResult) {
      reactiveItem.status = 'completed';
      reactiveItem.finalScore = submissionData.finalScore;
      calculateOverallProgress(); // Recalculate overall progress

      // Stop polling for this file
      if (pollingIntervalId.value !== null) {
        clearInterval(pollingIntervalId.value);
        pollingIntervalId.value = null;
      }

      // Move to the next file
      await processFileAtIndex(currentFileIndex + 1);

    } else {
       // Still polling, maybe update status text if backend provides it
       // reactiveItem.statusText = submissionData.status; // If backend provides detailed status
    }
  } catch (error: any) {
    console.error(`轮询提交 ${reactiveItem.submissionId} 失败:`, error);
    reactiveItem.status = 'error';
    reactiveItem.error = error.response?.data?.message || '处理失败';
    calculateOverallProgress(); // Recalculate overall progress after error

    // Stop polling for this file
    if (pollingIntervalId.value !== null) {
      clearInterval(pollingIntervalId.value);
      pollingIntervalId.value = null;
    }

    // Move to the next file
    await processFileAtIndex(currentFileIndex + 1);
  }
}

function calculateOverallProgress() {
  const totalFiles = processingFiles.value.length;
  if (totalFiles === 0) {
    overallProgress.value = 0;
    return;
  }
  // Progress is based on the count of files that are completed or have errored
  const completedOrErroredCount = processingFiles.value.filter(item => item.status === 'completed' || item.status === 'error').length;
  overallProgress.value = Math.min((completedOrErroredCount / totalFiles) * 100, 100);
}

function getProcessingStatusText(status: string) {
  switch (status) {
    case 'pending': return '等待上传';
    case 'uploading': return '上传中';
    case 'polling': return '处理中'; // This covers OCR and AI steps
    case 'completed': return '已完成';
    case 'error': return '失败';
    default: return status;
  }
}

// --- Drag and Drop Logic ---
function onDropFile(e: DragEvent) {
  e.preventDefault(); // Prevent default to avoid opening file in browser

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > maxFiles) {
        alert(`每次最多上传${maxFiles}篇作文`); // Or use a snackbar/toast
        selectedFiles.value = null; // Clear selection
    } else {
        selectedFiles.value = files;
        // If assignment and column count are already selected, trigger upload
        // Use nextTick to allow v-model to update
        nextTick(() => {
             if (selectedAssignment.value && columnCount.value > 0) {
                uploadEssay();
            } else {
                // Otherwise, user needs to select assignment/column count and click submit
                // The v-file-input will now show the selected files
            }
        });
    }
  }
}
// --- End Drag and Drop Logic ---


// Global event listeners (removed global drag/leave/drop)
onMounted(() => {
  fetchAssignments();
});

onUnmounted(() => {
  if (pollingIntervalId.value !== null) {
    clearInterval(pollingIntervalId.value);
  }
});

</script>

<style scoped>
.pre-wrap {
  white-space: pre-wrap;
}
/* 拖拽区域样式 */
.drag-file-area {
  position: relative;
  border: 2px dashed #ccc; /* Keep a default dashed border */
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 16px;
}

/* 让文件输入透明以便拖拽提示可见 */
.drag-file-area .v-file-input {
  background: transparent;
}
.v-file-input input[type="file"] {
  cursor: pointer;
}
</style>

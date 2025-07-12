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
            item-value="id"
            label="选择测验"
            required
          >
            <template v-slot:selection="{ item }">
              <span>{{ item.raw.description }}</span>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.description">
                <v-list-item-subtitle>{{ formatDate(item.raw.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
          <!-- 支持拖拽的文件输入 -->
          <div
            class="drag-file-area"
            @dragover.prevent
            @dragleave.prevent
            @drop.prevent="onDropFile"
          >
            <v-file-input
              v-model="selectedFiles"
              :label="`选择作文图片（支持拖动文件到此处选择，最多 ${maxFiles} 篇）`"
              accept="image/*"
              required
              multiple
              :max-files="maxFiles"
              show-size
              prepend-icon="mdi-upload"
              style="background: transparent"
              @click.stop
              chips
            >
              <!-- 使用 v-slot:selection 自定义文件标签显示 -->
              <!-- 添加 index 参数 -->
              <template v-slot:selection="{ fileNames }">
                <template v-for="(name, index) in fileNames" :key="name">
                  <v-chip
                    :text="name"
                    closable
                    @click:close="removeFile(index)"
                  ></v-chip>
                </template>
              </template>
            </v-file-input>
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

// Helper function to format date
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = new Date(dateString);
  // Add 8 hours for UTC+8
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options);
}

const assignments = ref<Assignment[]>([]);
const selectedAssignment = ref(null);
const selectedFiles = ref<File[] | null>(null); // 改为数组以支持多文件
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
const overallProgress = ref(0); // 整体批量进度（0-100）

// 批量处理配置
const maxFiles = 60; // 最大上传文件数目
const batchSize = 5; // 一次上传文件数目
const batchDelay = 5000; // 批次之间的延迟（毫秒）

let currentFileIndex = 0; // 跟踪下一个批次起始文件索引

// 用于存储每个文件的轮询定时器
const pollingIntervals = new Map<string, number | null>();
// 用于存储下一个批次处理的定时器 ID
let batchTimeoutId: number | null = null;


// 完成对话框状态
const completionDialog = ref(false);
const completionMessage = ref('');

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
    // 如果校验失败可提示
    return;
  }

  // 冗余校验最大文件数（v-file-input 已限制，但作为兜底）
  if (selectedFiles.value.length > maxFiles) {
     alert(`每次最多上传${maxFiles}篇作文`);
     return;
  }

  // 重置状态并切换视图
  isSubmitting.value = true;
  viewState.value = 'processing';
  overallProgress.value = 0;
  currentFileIndex = 0; // 重置文件索引
  processingFiles.value = selectedFiles.value.map(file => ({ file: file, status: 'pending' }));

  // 清除所有已有定时器
  clearAllTimers();

  // 开始处理第一批
  processNextBatch();

  isSubmitting.value = false; // 提交动作完成
}

function processNextBatch() {
    // 检查是否所有文件都已启动处理
    if (currentFileIndex >= processingFiles.value.length) {
        console.log('所有批次已启动');
        return;
    }

    const endIndex = Math.min(currentFileIndex + batchSize, processingFiles.value.length);
    console.log(`开始处理批次: 从索引 ${currentFileIndex} 到 ${endIndex - 1}`);

    // 处理当前批次的文件
    for (let i = currentFileIndex; i < endIndex; i++) {
        uploadAndPollFile(processingFiles.value[i]);
    }

    // 更新下一个批次的起始索引
    currentFileIndex = endIndex;

    // 如果还有剩余文件，安排下一个批次
    if (currentFileIndex < processingFiles.value.length) {
        console.log(`安排下一批次在 ${batchDelay / 1000} 秒后开始`);
        batchTimeoutId = setTimeout(processNextBatch, batchDelay) as any;
    } else {
        console.log('所有文件上传已安排');
    }
}

async function uploadAndPollFile(item: typeof processingFiles.value[0]) {
    item.status = 'uploading';
    console.log(`上传文件: ${item.file.name}`);

    try {
      const response = await uploadEssaySubmission(
        selectedAssignment.value!,
        item.file,
        columnCount.value
      );
      item.submissionId = response.submissionId;
      item.status = 'polling';
      console.log(`文件 ${item.file.name} 上传成功, submissionId: ${item.submissionId}. 开始轮询.`);
      // 启动该文件的轮询
      startPollingForFile(item);
    } catch (error: any) {
      console.error(`上传文件 ${item.file.name} 失败:`, error);
      item.status = 'error';
      item.error = error.response?.data?.message || '上传失败';
      calculateOverallProgress(); // 上传失败时更新进度
      checkOverallCompletion(); // 检查是否全部完成
    }
}


function startPollingForFile(item: typeof processingFiles.value[0]) {
  if (!item.submissionId) {
      console.error(`无法为文件 ${item.file.name} 启动轮询：缺少 submissionId`);
      return;
  }
  // 如有已有定时器先清除
  if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
      clearInterval(pollingIntervals.get(item.submissionId)!);
  }

  // 启动该文件的轮询
  const interval = setInterval(() => checkPollingStatusForFile(item), 2000) as any;
  pollingIntervals.set(item.submissionId, interval);
  console.log(`为 submissionId ${item.submissionId} 启动轮询定时器 ID: ${interval}`);
}

async function checkPollingStatusForFile(item: typeof processingFiles.value[0]) {
  if (!item.submissionId || item.status !== 'polling') {
      // 如果该文件不再轮询，清除其定时器
      if (item.submissionId && pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
          console.log(`停止轮询 submissionId ${item.submissionId} (状态不是 polling 或无 ID)`);
          clearInterval(pollingIntervals.get(item.submissionId)!);
          pollingIntervals.delete(item.submissionId);
      }
      return;
  }

  try {
    const submissionData = await getSubmissionById(item.submissionId);
    // 检查是否批改完成（judgeResult 已返回）
    if (submissionData.judgeResult) {
      console.log(`submissionId ${item.submissionId} 批改完成`);
      item.status = 'completed';
      item.finalScore = submissionData.finalScore;

      // 停止该文件的轮询
      if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
          console.log(`停止轮询 submissionId ${item.submissionId}`);
          clearInterval(pollingIntervals.get(item.submissionId)!);
          pollingIntervals.delete(item.submissionId);
      }

      calculateOverallProgress(); // 重新计算进度
      checkOverallCompletion(); // 检查是否全部完成

    } else {
       // 仍在轮询，可根据后端返回状态更新文本
       // item.statusText = submissionData.status;
    }
  } catch (error: any) {
    console.error(`轮询提交 ${item.submissionId} 失败:`, error);
    item.status = 'error';
    item.error = error.response?.data?.message || '处理失败';

    // 停止该文件的轮询
    if (pollingIntervals.has(item.submissionId) && pollingIntervals.get(item.submissionId) !== null) {
        console.log(`停止轮询 submissionId ${item.submissionId} (发生错误)`);
        clearInterval(pollingIntervals.get(item.submissionId)!);
        pollingIntervals.delete(item.submissionId);
    }

    calculateOverallProgress(); // 失败后重新计算进度
    checkOverallCompletion(); // 检查是否全部完成
  }
}

function calculateOverallProgress() {
  const totalFiles = processingFiles.value.length;
  if (totalFiles === 0) {
    overallProgress.value = 0;
    return;
  }
  // 进度基于已完成或失败的文件数
  const completedOrErroredCount = processingFiles.value.filter(item => item.status === 'completed' || item.status === 'error').length;
  overallProgress.value = Math.min((completedOrErroredCount / totalFiles) * 100, 100);
  console.log(`当前进度: ${overallProgress.value.toFixed(2)}% (${completedOrErroredCount}/${totalFiles})`);
}

function checkOverallCompletion() {
    const totalFiles = processingFiles.value.length;
    if (totalFiles === 0) return;

    const completedOrErroredCount = processingFiles.value.filter(item => item.status === 'completed' || item.status === 'error').length;

    if (completedOrErroredCount === totalFiles) {
        console.log('所有文件处理完成');
        calculateOverallProgress(); // 确保进度为100%
        // 显示完成对话框并跳转
        completionMessage.value = '全部批改完成！';
        completionDialog.value = true;

        // 清除批次定时器
        if (batchTimeoutId !== null) {
            clearTimeout(batchTimeoutId);
            batchTimeoutId = null;
            console.log('清除批次定时器');
        }

        // 5秒后自动关闭对话框并跳转
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
    case 'polling': return '处理中'; // 包括OCR和AI步骤
    case 'completed': return '已完成';
    case 'error': return '失败';
    default: return status;
  }
}

// --- 拖拽逻辑 ---
function onDropFile(e: DragEvent) {
  e.preventDefault(); // 阻止默认行为避免浏览器打开文件

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const newFiles = Array.from(e.dataTransfer.files);
    const currentFiles = selectedFiles.value ? Array.from(selectedFiles.value) : [];
    const combinedFiles = [...currentFiles, ...newFiles];

    if (combinedFiles.length > maxFiles) {
        alert(`文件总数不能超过 ${maxFiles} 篇。已自动选择前 ${maxFiles} 篇文件。`);
        selectedFiles.value = combinedFiles.slice(0, maxFiles);
    } else {
        selectedFiles.value = combinedFiles;
    }

    // 如果测验和分栏数已选，自动触发上传
    nextTick(() => {
         if (selectedAssignment.value && columnCount.value > 0 && selectedFiles.value && selectedFiles.value.length > 0) {
            uploadEssay();
        } else {
            // 否则需用户手动选择测验/分栏数并点击提交
            // v-file-input 会显示已选文件
        }
    });
  }
}
// --- 拖拽逻辑结束 ---

function removeFile(index: number) {
  if (selectedFiles.value) {
    selectedFiles.value.splice(index, 1);
  }
}

function clearAllTimers() {
    // 清除所有轮询定时器
    pollingIntervals.forEach((intervalId, submissionId) => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            console.log(`清除轮询定时器 ID: ${intervalId} (submissionId: ${submissionId})`);
        }
    });
    pollingIntervals.clear();

    // 清除批次定时器
    if (batchTimeoutId !== null) {
        clearTimeout(batchTimeoutId);
        batchTimeoutId = null;
        console.log('清除批次定时器');
    }
}


// 生命周期钩子
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

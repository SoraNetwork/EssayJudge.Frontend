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
          <div style="font-size: 12px; color: #999; margin-top: 4px;">
            切分线数量 = 分栏数 - 1，系统会自动均匀分布切分线
          </div>
        </a-form-item>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px;">
          <a-switch v-model:checked="enableV3" checked-children="启用 V3 OCR方式" un-checked-children="禁用 V3 OCR方式" />
          <a-button type="primary" html-type="submit" :loading="isSubmitting">提交</a-button>
        </div>
      </a-form>
    </a-card>
    
    <!-- 写好了记得删 -->
    <div v-if="enableV3 == false" class="overlay">
      <a-card>
        <template #title>还没开发好</template>
        <p>别这样做</p>
        <a-button type="primary" @click="openV3">打开V3</a-button>
      </a-card>
    </div>

    <!-- Answer Card Splitting Section (shown when enableV3=false) -->
    <a-card v-if="!enableV3 && fileList.length > 0" style="margin-top: 16px;">
      <template #title>答题卡切分</template>
      <template #extra>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="status" style="color: #999;">等待 OpenCV.js 加载...</span>
          <a-button
            v-if="openCvLoadError"
            type="link"
            size="small"
            @click="retryLoadOpenCV"
          >
            重试
          </a-button>
        </div>
      </template>
      
      <div style="margin-bottom: 16px;">
        <a-button id="addLineBtn" type="primary" size="small" disabled @click="addSplitLine">
          添加切分线（自动增加分栏数）
        </a-button>
        <span style="margin-left: 16px;">切分点坐标: <span id="coordsOutput">无切分点</span></span>
      </div>

      <!-- Image display and splitting area -->
      <div id="scrollWrapper" style="display: none; overflow-x: auto; border: 1px solid #ddd; position: relative; margin-bottom: 16px;">
        <div id="container" style="position: relative; display: inline-block;">
          <canvas id="srcCanvas"></canvas>
          <!-- Split lines will be added here dynamically -->
        </div>
      </div>

      <!-- Split results preview -->
      <div id="results" style="display: flex; flex-wrap: wrap; gap: 16px;"></div>
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
import { formatDateUTC8 } from '@/composables/useDateFormat';

const router = useRouter();

const assignments = ref<Assignment[]>([]);
const selectedAssignment = ref<string | null>(null);
const selectedFiles = ref<File[] | null>(null);
const fileList = ref<any[]>([]);
const columnCount = ref(3);
const isSubmitting = ref(false);
const enableV3 = ref(true);

// OpenCV and image splitting state
let isOpenCvReady = false;
let isOpenCvLoading = false;
let openCvLoadError = false;
let openCvLoadTimeout: ReturnType<typeof setTimeout> | null = null;
const OPENCV_LOAD_TIMEOUT = 30000; // 30 seconds timeout
const OPENCV_URL = 'https://docs.opencv.org/4.8.0/opencv.js';
let srcMat: any = null;
let lines: Array<{ id: number; x: number; element: HTMLElement }> = [];
let lineIdCounter = 0;
let activeDraggingLine: { id: number; x: number; element: HTMLElement } | null | undefined = null;
let splitCoordinates: number[] = [];

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

const openV3 = () => {
  enableV3.value = true;
  // 写好了记得删
};
// Assignment options for select
const assignmentOptions = computed(() => {
return assignments.value
  .slice() // 创建副本避免修改原始数组
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // 按创建时间降序排列
  .map(item => ({
     value: item.id,
     label: item.description ,
     description: item.description,
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

// 监听 fileList 变化，当 enableV3=false 时加载第一张图片用于切分
watch([fileList, enableV3], ([newFileList, newEnableV3]) => {
  if (!newEnableV3 && newFileList.length > 0) {
    nextTick(() => {
      // First load OpenCV if not ready
      if (!isOpenCvReady && !isOpenCvLoading) {
        loadOpenCV().then(() => {
          loadFirstImageForSplitting();
        }).catch((error) => {
          console.error('Failed to load OpenCV:', error);
        });
      } else if (isOpenCvReady) {
        loadFirstImageForSplitting();
      }
    });
  }
}, { deep: true });

// 监听 columnCount 变化，自动调整切分线数量
watch(columnCount, (newColumnCount) => {
  if (!enableV3.value && srcMat) {
    updateSplitLinesForColumnCount(newColumnCount);
  }
});

// 根据分栏数更新切分线
function updateSplitLinesForColumnCount(count: number) {
  if (!srcMat) return;

  // 切分线数量 = 分栏数 - 1
  const targetLineCount = Math.max(0, count - 1);

  // 清除所有现有切分线
  clearAllLines();

  // 如果需要切分线，则均匀分布添加
  if (targetLineCount > 0) {
    const step = srcMat.cols / count;
    for (let i = 1; i < count; i++) {
      const xPos = Math.floor(step * i);
      addSplitLine(xPos);
    }
  }

  console.log(`Updated ${targetLineCount} split lines for ${count} columns`);
}

// Handle file upload
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 返回 false 阻止自动上传，让 fileList 自动管理
  return false;
};

// Dynamic load OpenCV.js
function loadOpenCV(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded or loading, return immediately
    if (isOpenCvReady) {
      resolve();
      return;
    }
    if (isOpenCvLoading) {
      // Already loading, wait for it
      const checkInterval = setInterval(() => {
        if (isOpenCvReady) {
          clearInterval(checkInterval);
          resolve();
        } else if (openCvLoadError) {
          clearInterval(checkInterval);
          reject(new Error('OpenCV.js failed to load'));
        }
      }, 200);
      return;
    }

    isOpenCvLoading = true;
    openCvLoadError = false;

    // Update status
    const status = document.getElementById('status');
    if (status) {
      status.innerText = '正在加载 OpenCV.js (约 7MB)...';
      status.style.color = '#ff9800';
    }

    // Set timeout
    if (openCvLoadTimeout !== null) {
      clearTimeout(openCvLoadTimeout);
    }
    openCvLoadTimeout = setTimeout(() => {
      isOpenCvLoading = false;
      openCvLoadError = true;
      if (status) {
        status.innerText = 'OpenCV.js 加载超时，请检查网络连接';
        status.style.color = '#ff4d4f';
      }
      reject(new Error('OpenCV.js load timeout'));
    }, OPENCV_LOAD_TIMEOUT);

    // Create script element
    const script = document.createElement('script');
    script.src = OPENCV_URL;
    script.async = true;

    script.onload = () => {
      console.log('OpenCV.js script loaded, waiting for initialization...');
      // Wait for cv to be available
      const checkCvReady = setInterval(() => {
        if ((window as any).cv && (window as any).cv.imread) {
          clearInterval(checkCvReady);
          if (openCvLoadTimeout !== null) {
            clearTimeout(openCvLoadTimeout);
            openCvLoadTimeout = null;
          }
          isOpenCvReady = true;
          isOpenCvLoading = false;
          openCvLoadError = false;

          if (status) {
            status.innerText = 'OpenCV.js 已就绪';
            status.style.color = '#52c41a';
          }

          const addLineBtn = document.getElementById('addLineBtn');
          if (addLineBtn) {
            (addLineBtn as HTMLButtonElement).disabled = false;
          }

          console.log('OpenCV.js is ready');
          resolve();
        }
      }, 100);

      // Fallback timeout for cv initialization
      setTimeout(() => {
        clearInterval(checkCvReady);
        isOpenCvLoading = false;
        openCvLoadError = true;
        if (status) {
          status.innerText = 'OpenCV.js 初始化失败';
          status.style.color = '#ff4d4f';
        }
        reject(new Error('OpenCV.js initialization failed'));
      }, 10000);
    };

    script.onerror = () => {
      isOpenCvLoading = false;
      openCvLoadError = true;
      if (openCvLoadTimeout !== null) {
        clearTimeout(openCvLoadTimeout);
        openCvLoadTimeout = null;
      }
      if (status) {
        status.innerText = 'OpenCV.js 加载失败，请检查网络连接';
        status.style.color = '#ff4d4f';
      }
      reject(new Error('Failed to load OpenCV.js script'));
    };

    document.head.appendChild(script);
  });
}

// Retry loading OpenCV
function retryLoadOpenCV() {
  loadOpenCV().then(() => {
    if (!enableV3.value && fileList.value.length > 0) {
      nextTick(() => {
        loadFirstImageForSplitting();
      });
    }
  }).catch((error) => {
    console.error('Failed to retry OpenCV load:', error);
  });
}

// Load first image for splitting
function loadFirstImageForSplitting() {
  if (fileList.value.length === 0 || !fileList.value[0].originFileObj) return;

  // Check if OpenCV is ready
  if (!isOpenCvReady) {
    console.warn('OpenCV.js is not ready yet');
    return;
  }

  const file = fileList.value[0].originFileObj;
  const status = document.getElementById('status');

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Invalid file type:', file.type);
    if (status) {
      status.innerText = '文件格式错误，请上传图片文件';
      status.style.color = '#ff4d4f';
    }
    return;
  }

  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    console.error('File too large:', file.size);
    if (status) {
      status.innerText = '图片文件过大，请上传小于 10MB 的图片';
      status.style.color = '#ff4d4f';
    }
    return;
  }

  if (status) {
    status.innerText = '正在加载图片...';
    status.style.color = '#ff9800';
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues

    img.onload = () => {
      console.log('Image loaded, dimensions:', img.width, 'x', img.height);

      // Validate image dimensions
      if (img.width === 0 || img.height === 0) {
        console.error('Invalid image dimensions');
        if (status) {
          status.innerText = '图片尺寸无效';
          status.style.color = '#ff4d4f';
        }
        return;
      }

      // Limit maximum dimensions to prevent memory issues
      const maxDimension = 10000;
      if (img.width > maxDimension || img.height > maxDimension) {
        console.error('Image too large:', img.width, 'x', img.height);
        if (status) {
          status.innerText = `图片尺寸过大（最大支持 ${maxDimension}px）`;
          status.style.color = '#ff4d4f';
        }
        return;
      }

      const scrollWrapper = document.getElementById('scrollWrapper');
      if (scrollWrapper) {
        scrollWrapper.style.display = 'block';
      }

      const canvas = document.getElementById('srcCanvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas not found');
        if (status) {
          status.innerText = 'Canvas 元素未找到';
          status.style.color = '#ff4d4f';
        }
        return;
      }

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear previous content
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Failed to get canvas context');
        if (status) {
          status.innerText = '无法获取 Canvas 上下文';
          status.style.color = '#ff4d4f';
        }
        return;
      }

      // Draw image to canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Clean up previous matrix
      if (srcMat) {
        try {
          srcMat.delete();
        } catch (e) {
          console.warn('Failed to delete previous srcMat:', e);
        }
        srcMat = null;
      }

      // Read image with OpenCV using error handling
      try {
        console.log('Attempting to read image with OpenCV...');

        // Method 1: Try using cv.Mat.fromImageData (more reliable)
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          console.log('Got ImageData, size:', imageData.data.length);

          // Check if imageData is valid
          if (!imageData || !imageData.data || imageData.data.length === 0) {
            throw new Error('Invalid ImageData');
          }

          // Check data integrity
          const expectedSize = canvas.width * canvas.height * 4;
          if (imageData.data.length !== expectedSize) {
            console.warn('ImageData size mismatch, expected:', expectedSize, 'got:', imageData.data.length);
          }

          srcMat = (window as any).cv.Mat.fromImageData(imageData);
          console.log('Image loaded using Mat.fromImageData, dimensions:', srcMat.cols, 'x', srcMat.rows);
        } catch (firstError) {
          console.warn('Mat.fromImageData failed, trying cv.imread:', firstError);

          // Method 2: Fallback to cv.imread
          srcMat = (window as any).cv.imread(canvas);
          console.log('Image loaded using cv.imread, dimensions:', srcMat.cols, 'x', srcMat.rows);
        }

        if (!srcMat || srcMat.cols === 0 || srcMat.rows === 0) {
          throw new Error('OpenCV returned invalid matrix');
        }

        console.log('Image loaded successfully with OpenCV, dimensions:', srcMat.cols, 'x', srcMat.rows);

        // Clear existing lines and add split lines based on column count
        clearAllLines();
        updateSplitLinesForColumnCount(columnCount.value);

        if (status) {
          status.innerText = '图片加载成功，可以进行切分';
          status.style.color = '#52c41a';
        }
      } catch (error) {
        console.error('Failed to read image with OpenCV:', error);
        if (status) {
          status.innerText = 'OpenCV 处理失败，请尝试其他图片格式';
          status.style.color = '#ff4d4f';
        }

        // Fallback: Try to work without OpenCV
        console.log('Attempting fallback mode without OpenCV...');

        // Store canvas dimensions for manual splitting
        if (!srcMat) {
          // Create a simple mock object with dimensions
          srcMat = {
            cols: canvas.width,
            rows: canvas.height,
            delete: () => {},
            roi: () => ({ delete: () => {} }),
            clone: () => ({ delete: () => {} })
          } as any;
          console.log('Using fallback mode with canvas dimensions:', srcMat.cols, 'x', srcMat.rows);
        }

        // Clear existing lines and add split lines based on column count
        clearAllLines();
        updateSplitLinesForColumnCount(columnCount.value);

        if (status) {
          status.innerText = '已切换到预览模式（无法切分预览）';
          status.style.color = '#ff9800';
        }

        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
          resultsDiv.innerHTML = '<p style="color: #ff9800;">OpenCV 处理失败，显示原始图片。切分预览不可用，但可以提交。</p>';
        }
      }

      const addLineBtn = document.getElementById('addLineBtn');
      if (addLineBtn) {
        (addLineBtn as HTMLButtonElement).disabled = false;
      }
    };

    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      if (status) {
        status.innerText = '图片加载失败，请检查文件格式';
        status.style.color = '#ff4d4f';
      }
    };

    // Set image source
    img.src = event.target?.result as string;
  };

  reader.onerror = (error) => {
    console.error('FileReader error:', error);
    if (status) {
      status.innerText = '读取文件失败';
      status.style.color = '#ff4d4f';
    }
  };

  reader.readAsDataURL(file);
}

// Add split line
function addSplitLine(xPos?: number) {
  // Check if image is loaded (srcMat exists)
  if (!srcMat) {
    console.warn('Cannot add split line: no image loaded');
    return;
  }

  // If no position provided, add in the middle
  if (xPos === undefined) {
    xPos = Math.floor(srcMat.cols / 2);
  }

  const id = lineIdCounter++;
  const lineEl = document.createElement('div');
  lineEl.className = 'split-line';
  lineEl.style.left = xPos + 'px';
  lineEl.innerHTML = `
    <span class="line-label">${xPos}px</span>
    <button class="delete-btn" onclick="window.removeSplitLine(${id}, event)">×</button>
  `;

  lineEl.onmousedown = (e) => {
    if ((e.target as HTMLElement).className === 'delete-btn') return;
    activeDraggingLine = lines.find(l => l.id === id);
    e.preventDefault();
  };

  const container = document.getElementById('container');
  if (!container) {
    console.error('Container not found');
    return;
  }

  // Debug: log container dimensions
  const containerRect = container.getBoundingClientRect();
  console.log('Container dimensions:', {
    width: containerRect.width,
    height: containerRect.height,
    display: window.getComputedStyle(container).display,
    position: window.getComputedStyle(container).position
  });

  container.appendChild(lineEl);
  lines.push({ id: id, x: xPos, element: lineEl });

  // Update column count based on new split lines
  // Column count = split lines + 1
  const newColumnCount = Math.min(10, lines.length + 1);
  columnCount.value = newColumnCount;

  updateSplitUI();
  console.log('Split line added at position:', xPos);
}

// Global function to remove split line
(window as any).removeSplitLine = function(id: number, e: MouseEvent) {
  e.stopPropagation();
  const index = lines.findIndex(l => l.id === id);
  if (index > -1) {
    const container = document.getElementById('container');
    if (container) {
      container.removeChild(lines[index].element);
    }
    lines.splice(index, 1);

    // Update column count based on remaining split lines
    // Column count = split lines + 1
    const newColumnCount = Math.max(1, lines.length + 1);
    columnCount.value = newColumnCount;

    updateSplitUI();
  }
};

// Clear all lines
function clearAllLines() {
  const container = document.getElementById('container');
  if (container) {
    lines.forEach(l => container.removeChild(l.element));
  }
  lines = [];
}

// Show coordinates only (for smooth dragging)
function showCoordsOnly() {
  const coordsOutput = document.getElementById('coordsOutput');
  if (coordsOutput) {
    let coords = lines.map(l => l.x).sort((a, b) => a - b);
    coordsOutput.innerText = coords.length > 0 ? coords.join('px, ') + 'px' : '无切分点';
  }
}

// Update split UI (coordinates and slice preview)
function updateSplitUI() {
  showCoordsOnly();
  sliceImage();
}

// Slice image preview
function sliceImage() {
  if (!srcMat) return;
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '';
  }

  // Check if OpenCV is properly available
  const cv = (window as any).cv;
  const isOpenCVAvailable = cv && cv.imread && cv.Rect && cv.imshow;

  if (!isOpenCVAvailable) {
    console.warn('OpenCV is not available, skipping slice preview');
    if (resultsDiv) {
      resultsDiv.innerHTML = '<p style="color: #ff9800;">切分预览不可用（OpenCV 未加载），但可以正常提交。</p>';
    }
    // Store split coordinates for submission
    splitCoordinates = lines.map(l => l.x).sort((a, b) => a - b);
    return;
  }

  let coords = lines.map(l => l.x);
  coords.push(0, srcMat.cols);
  coords.sort((a, b) => a - b);
  let uniqueCoords = [...new Set(coords)];

  for (let i = 0; i < uniqueCoords.length - 1; i++) {
    let startX = uniqueCoords[i];
    let endX = uniqueCoords[i + 1];
    let width = endX - startX;
    if (width <= 0) continue;

    const box = document.createElement('div');
    box.className = 'result-box';
    const resCanvas = document.createElement('canvas');
    resCanvas.id = `res_${i}`;
    box.appendChild(resCanvas);
    const info = document.createElement('div');
    info.innerText = `区间: [${startX}, ${endX}]\n宽度: ${width}px`;
    box.appendChild(info);

    if (resultsDiv) {
      resultsDiv.appendChild(box);
    }

    try {
      let rect = new cv.Rect(startX, 0, width, srcMat.rows);
      let roi = srcMat.roi(rect);
      cv.imshow(resCanvas.id, roi);
      roi.delete();
    } catch (error) {
      console.error('Failed to create slice preview:', error);
      const errorMsg = document.createElement('p');
      errorMsg.style.color = '#ff4d4f';
      errorMsg.style.fontSize = '12px';
      errorMsg.innerText = '切分预览生成失败';
      box.appendChild(errorMsg);
    }
  }

  // Store split coordinates for submission
  splitCoordinates = lines.map(l => l.x).sort((a, b) => a - b);
}

// Add mouse move and up handlers for dragging
document.onmousemove = (e) => {
  if (!activeDraggingLine || !srcMat) return;
  const container = document.getElementById('container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(x, srcMat.cols));

  activeDraggingLine.x = Math.floor(x);
  activeDraggingLine.element.style.left = x + 'px';
  const label = activeDraggingLine.element.querySelector('.line-label');
  if (label) {
    label.textContent = activeDraggingLine.x + 'px';
  }
  showCoordsOnly();
};

document.onmouseup = () => {
  if (activeDraggingLine) {
    activeDraggingLine = null;
    updateSplitUI();
  }
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
    enableV3.value,
    !enableV3.value ? splitCoordinates : undefined
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
  const response = await uploadEssayBatchSubmission(
    selectedAssignment.value!,
    files,
    columnCount.value,
    enableV3.value,
    !enableV3.value ? splitCoordinates : undefined
  );
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
  // Clean up OpenCV resources
  if (srcMat) {
    srcMat.delete();
    srcMat = null;
  }
  // Clear OpenCV load timeout
  if (openCvLoadTimeout !== null) {
    clearTimeout(openCvLoadTimeout);
    openCvLoadTimeout = null;
  }
  // Remove event listeners
  document.onmousemove = null;
  document.onmouseup = null;
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

/* Overlay style for full-screen semi-transparent black */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Black with 50% opacity */
  z-index: 9999; /* Ensure it's above other elements */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Split line styles */
:deep(.split-line) {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: rgba(255, 0, 0, 0.7);
  cursor: ew-resize;
  z-index: 10;
  user-select: none;
}

:deep(.split-line:hover) {
  background-color: rgba(255, 0, 0, 1);
}

:deep(.line-label) {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
}

:deep(.delete-btn) {
  position: absolute;
  top: -20px;
  right: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: #ff4d4f;
  color: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.delete-btn:hover) {
  background-color: #ff7875;
}

.result-box {
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.result-box canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid #eee;
}

.result-box div {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  white-space: pre-line;
}
</style>
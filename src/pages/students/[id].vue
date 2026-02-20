<template>
  <div class="student-detail-container">
    <a-button style="margin-bottom: 16px;" type="link" href="/students">
      <template #icon><ArrowLeftOutlined /></template>
      返回学生列表
    </a-button>

    <div v-if="loading" class="flex justify-center items-center" style="height: 400px;">
      <a-spin size="large" />
    </div>

    <div v-else-if="error" class="text-center py-8">
      <ExclamationCircleOutlined class="text-red-500 text-6xl mb-4" />
      <h2 class="text-xl text-red-500">{{ error }}</h2>
    </div>

    <div v-else>
      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <a-card>
            <div class="text-center pt-6">
              <a-avatar :size="120" class="mb-4">
                <span class="text-4xl">{{ getInitials(student.name) }}</span>
              </a-avatar>
              <h2 class="text-xl mb-1">{{ student.name }}</h2>
              <p class="text-gray-500 mb-2">班级：{{ student.className || '未分配' }}</p>
              <p class="text-gray-500 mb-4">学号：{{ student.studentId }}</p>
              <a-button block type="primary" @click="editDialog = true">
                <template #icon><EditOutlined /></template>
                编辑信息
              </a-button>
            </div>
          </a-card>

          <a-row class="mt-4" :gutter="16">
            <a-col :span="12">
              <a-card size="small">
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ submissionSummaries.length }}</div>
                  <div class="text-xs text-gray-500">提交数</div>
                </div>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card size="small">
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ averageScore }}</div>
                  <div class="text-xs text-gray-500">平均分</div>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </a-col>

        <a-col :xs="24" :md="16">
          <a-card title="作文提交历史">
            <a-table
              :columns="columns"
              :data-source="submissionSummaries"
              :loading="loadingSubmissions"
              :pagination="{ pageSize: 5 }"
              row-key="id"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'titleContext'">
                  <a-tooltip :title="record.titleContext">
                    <span class="truncate inline-block" style="max-width: 150px">{{ record.titleContext }}</span>
                  </a-tooltip>
                </template>
                <template v-if="column.key === 'finalScore'">
                  <span v-if="!record.isError" :class="getScoreColor(record.finalScore)">{{ record.finalScore }}</span>
                  <span v-else class="text-red-500">Error</span>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDateUTC8(record.createdAt) }}
                </template>
                <template v-if="column.key === 'actions'">
                  <a-button type="link" size="small" @click="openInNewTab(`/essays/${record.id}`)">查看</a-button>
                </template>
              </template>
            </a-table>
          </a-card>

          <a-card class="mt-4" v-if="hasEvaluatedSubmissions">
            <template #title>成绩趋势</template>
            
            <div class="chart-layout-wrapper">
              <div class="y-axis-container">
                <div 
                  v-for="(label, i) in yAxisLabels" 
                  :key="'y-'+i" 
                  class="y-axis-tick"
                  :style="{ top: (yAxisTickPositions[i] || 0) + 'px' }"
                >
                  {{ label }}
                </div>
              </div>

              <div class="chart-scroll-area custom-scrollbar" ref="scrollContainer">
                <div :style="{ width: chartWidth + 'px', height: '100%', position: 'relative' }">
                  <canvas
                    ref="chartCanvas"
                    @click="handleChartClick"
                    @mousemove="handleChartMouseMove"
                    @mouseleave="handleChartMouseLeave"
                  ></canvas>

                  <div
                    v-for="(label, index) in xAxisLabels"
                    :key="'x-'+index"
                    class="x-axis-tick"
                    :style="{ left: label.x + 'px' }"
                  >
                    {{ label.text }}
                  </div>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <div v-if="tooltipVisible" class="chart-tooltip-fixed" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }">
        <div class="tooltip-content">
          <div class="tooltip-title">{{ tooltipData.title }}</div>
          <div class="tooltip-score">分数: <span :class="getScoreColor(tooltipData.score)">{{ tooltipData.score }}</span></div>
          <div class="tooltip-date">时间: {{ tooltipData.date }}</div>
          <div class="tooltip-hint">点击查看详情</div>
        </div>
      </div>

      <a-modal v-model:open="editDialog" title="编辑学生信息" :confirm-loading="saving" @ok="saveStudent">
        <a-form ref="formRef" :model="editedItem" layout="vertical">
          <a-form-item label="姓名" name="name" :rules="[{ required: true }]">
            <a-input v-model:value="editedItem.name" />
          </a-form-item>
          <a-form-item label="学号" name="studentId">
            <a-input v-model:value="editedItem.studentId" />
          </a-form-item>
          <a-form-item label="班级" name="classId">
            <a-select v-model:value="editedItem.classId" :options="classOptions" show-search allowClear />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftOutlined, ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons-vue'
import { submissionSummary, getClasses, updateStudent, getClassById, getStudents } from '@/services/apiService'
import { formatDateUTC8 } from '@/composables/useDateFormat'

const route = useRoute()
const studentId = computed(() => (route.params as { id: string }).id)

// 状态
const loading = ref(true)
const error = ref('')
const student = ref<any>({})
const submissionSummaries = ref<any[]>([])
const classes = ref<any[]>([])
const loadingSubmissions = ref(false)
const editDialog = ref(false)
const saving = ref(false)
const formRef = ref()

// 图表状态
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const scrollContainer = ref<HTMLDivElement | null>(null)
const chartWidth = ref(0)
const yAxisTickPositions = ref<number[]>([])
const xAxisLabels = ref<any[]>([])
const chartPoints = ref<any[]>([])
const hoveredPointIndex = ref(-1)
const tooltipVisible = ref(false)
const tooltipData = ref<any>({})
const tooltipPos = ref({ x: 0, y: 0 })
const tooltipPosition = ref({ x: 0, y: 0 })

// 表格配置
const columns = [
  { title: '测验题目', key: 'titleContext' },
  { title: '分数', key: 'finalScore', sorter: (a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0) },
  { title: '提交时间', key: 'createdAt' },
  { title: '操作', key: 'actions' }
]

// 数据处理
const chartData = computed(() => {
  return submissionSummaries.value
    .filter(s => !s.isError && s.finalScore !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(sub => ({
      date: formatDateUTC8(sub.createdAt).split(' ')[0], // 只取日期
      score: sub.finalScore,
      title: sub.titleContext || '未命名作文',
      id: sub.id
    }))
})

const yAxisLabels = computed(() => {
  if (chartData.value.length === 0) return []
  const scores = chartData.value.map(d => d.score)
  let max = Math.ceil(Math.max(...scores) / 10) * 10
  let min = Math.floor(Math.min(...scores) / 10) * 10
  if (max === min) { max += 10; min = Math.max(0, min - 10) }
  const step = (max - min) / 5
  return Array.from({ length: 6 }, (_, i) => (max - step * i).toFixed(0))
})

const averageScore = computed(() => {
  const valid = submissionSummaries.value.filter(s => !s.isError && s.finalScore !== undefined)
  if (!valid.length) return '-'
  return (valid.reduce((acc, c) => acc + c.finalScore, 0) / valid.length).toFixed(1)
})

const hasEvaluatedSubmissions = computed(() => chartData.value.length > 0)

// API 加载
async function fetchStudentDetails() {
  loading.value = true
  try {
    const all = await getStudents({});
    const data = all.find(s => s.id === studentId.value);
    if (!data) throw new Error('学生不存在');
    
    let clsName = '';
    if (data.classId) {
      const cls = await getClassById(data.classId);
      clsName = cls?.name || '';
    }
    student.value = { ...data, className: clsName };
    editedItem.value = { ...data };
    
    submissionSummaries.value = await submissionSummary(studentId.value) || [];
    classes.value = await getClasses() || [];
  } catch (err: any) {
    error.value = err.message || '加载失败';
  } finally {
    loading.value = false
  }
}

// 绘图逻辑
function drawChart() {
  const canvas = chartCanvas.value;
  const container = scrollContainer.value;
  if (!canvas || !container || chartData.value.length === 0) return;

  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const padding = { top: 30, right: 50, bottom: 70, left: 30 };
  const viewHeight = 350;
  const pointSpacing = 100;

  // 1. 计算宽度
  const neededWidth = padding.left + padding.right + (chartData.value.length - 1) * pointSpacing;
  chartWidth.value = Math.max(container.clientWidth, neededWidth);

  // 2. 设置尺寸
  canvas.width = chartWidth.value * dpr;
  canvas.height = viewHeight * dpr;
  canvas.style.width = `${chartWidth.value}px`;
  canvas.style.height = `${viewHeight}px`;
  ctx.scale(dpr, dpr);

  const innerW = chartWidth.value - padding.left - padding.right;
  const innerH = viewHeight - padding.top - padding.bottom;

  // 3. 计算坐标范围
  const scores = chartData.value.map(d => d.score);
  let max = Math.ceil(Math.max(...scores) / 10) * 10;
  let min = Math.floor(Math.min(...scores) / 10) * 10;
  if (max === min) { max += 10; min = Math.max(0, min - 10) }
  const range = max - min;

  // 4. 清除并绘制背景线
  ctx.clearRect(0, 0, chartWidth.value, viewHeight);
  yAxisTickPositions.value = [];
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (innerH * i) / 5;
    yAxisTickPositions.value.push(y);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth.value, y);
    ctx.stroke();
  }

  // 5. 计算点位
  const points = chartData.value.map((d, i) => ({
    x: padding.left + (chartData.value.length > 1 ? (innerW * i) / (chartData.value.length - 1) : innerW / 2),
    y: padding.top + innerH - ((d.score - min) / range) * innerH,
    data: d
  }));
  chartPoints.value = points;

  // 6. 绘制折线
  ctx.beginPath();
  ctx.strokeStyle = '#1890ff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // 7. 绘制点
  points.forEach((p, i) => {
    const active = i === hoveredPointIndex.value;
    ctx.beginPath();
    ctx.arc(p.x, p.y, active ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#1890ff' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 8. 同步 X 轴标签
  xAxisLabels.value = points.map(p => ({ x: p.x, text: p.data.date }));
}

// 交互
function handleChartMouseMove(e: MouseEvent) {
  const rect = chartCanvas.value!.getBoundingClientRect();
  const x = e.offsetX;
  const y = e.offsetY;
  
  let found = -1;
  chartPoints.value.forEach((p, i) => {
    if (Math.sqrt((x - p.x)**2 + (y - p.y)**2) < 15) found = i;
  });

  if (found !== hoveredPointIndex.value) {
    hoveredPointIndex.value = found;
    drawChart();
  }

  if (found !== -1) {
    tooltipVisible.value = true;
    tooltipData.value = chartPoints.value[found].data;
    const point = chartPoints.value[found];
    const pos = { x: rect.left + point.x, y: rect.top + point.y - 20 };
    tooltipPos.value = pos;
    tooltipPosition.value = pos;
  } else {
    tooltipVisible.value = false;
  }
}

function handleChartMouseLeave() {
  hoveredPointIndex.value = -1;
  tooltipVisible.value = false;
  drawChart();
}

function handleChartClick() {
  if (hoveredPointIndex.value !== -1) {
    openInNewTab(`/essays/${chartPoints.value[hoveredPointIndex.value].data.id}`);
  }
}

// 其余辅助函数
const editedItem = ref<any>({});
const classOptions = computed(() => classes.value.map(c => ({ label: c.name, value: c.id })));
async function saveStudent() {
  try {
    await formRef.value.validate();
    saving.value = true;
    await updateStudent(student.value.id, editedItem.value);
    editDialog.value = false;
    fetchStudentDetails();
  } catch (e) {} finally { saving.value = false }
}
function openInNewTab(url: string) { window.open(url, '_blank') }
function getInitials(n: string) { return n ? n[0].toUpperCase() : '?' }
function getScoreColor(s: number) {
  if (s >= 90) return 'text-green-500';
  if (s >= 60) return 'text-blue-500';
  return 'text-red-500';
}

onMounted(() => {
  fetchStudentDetails();
  window.addEventListener('resize', drawChart);
});
onUnmounted(() => window.removeEventListener('resize', drawChart));
watch(chartData, () => nextTick(drawChart));
</script>

<style scoped>
.student-detail-container {
  padding: 0;
}

/* 图表核心布局 */
.chart-layout-wrapper {
  display: flex;
  flex-direction: row;
  height: 350px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.y-axis-container {
  width: 45px;
  height: 100%;
  position: relative;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  z-index: 5;
  background: var(--bg-color);
}

.y-axis-tick {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  font-size: 12px;
  color: #8c8c8c;
}

.chart-scroll-area {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.x-axis-tick {
  position: absolute;
  top: 290px; /* 对应 Canvas padding-bottom 上方 */
  transform: translateX(-50%) rotate(-40deg);
  transform-origin: top center;
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
  pointer-events: none;
}

/* 提示框 */
.chart-tooltip-fixed {
  position: fixed;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  pointer-events: none;
  transform: translate(-50%, -120%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  min-width: 200px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -110%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -120%);
  }
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  word-break: break-word;
  max-width: 200px;
  line-height: 1.4;
}

.tooltip-score {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tooltip-score span {
  font-size: 16px;
  font-weight: 700;
}

.tooltip-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

.tooltip-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-style: italic;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f9f9f9;
}
</style>
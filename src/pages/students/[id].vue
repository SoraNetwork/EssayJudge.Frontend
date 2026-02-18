<template>
  <div>
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
        <!-- 学生信息卡片 -->
        <a-col :xs="24" :md="8">
          <a-card>
            <div class="text-center pt-6">
              <a-avatar :size="120" class="mb-4">
                <span class="text-4xl">{{ getInitials(student.name) }}</span>
              </a-avatar>

              <h2 class="text-xl mb-1">{{ student.name }}</h2>
              <p class="text-gray-500 mb-4" >班级：{{ student.className || '未分配班级' }}</p>
              <p class="text-gray-500 mb-4">学号：{{ student.studentId }}</p>

              <a-button
                block
                type="primary"
                @click="editDialog = true"
                class="mb-2"
              >
                <template #icon><EditOutlined /></template>
                编辑学生信息
              </a-button>
            </div>
          </a-card>

          <!-- 统计卡片 -->
          <a-row class="mt-4" :gutter="16">
            <a-col :span="12">
              <a-card>
                <div class="text-center">
                  <div class="text-4xl font-bold">{{ submissionSummaries.length }}</div>
                  <div class="text-sm text-gray-500">作文提交</div>
                </div>
              </a-card>
            </a-col>

            <a-col :span="12">
              <a-card>
                <div class="text-center">
                  <div class="text-4xl font-bold">{{ averageScore }}</div>
                  <div class="text-sm text-gray-500">平均分</div>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </a-col>

        <!-- 作文提交列表 -->
        <a-col :xs="24" :md="16">
          <a-card>
            <template #title>作文提交历史</template>

            <a-table
              :columns="columns"
              :data-source="submissionSummaries"
              :loading="loadingSubmissions"
              :pagination="false"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'titleContext'">
                  <a-tooltip :title="record.titleContext">
                    <span class="truncate inline-block" style="max-width: 200px">
                      {{ record.titleContext }}
                    </span>
                  </a-tooltip>
                </template>

                <template v-if="column.key === 'isError'">
                  <a-tag :color="record.isError ? 'red' : 'green'">
                    {{ record.isError ? '错误' : '正常' }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'finalScore'">
                  <template v-if="!record.isError && record.finalScore !== undefined">
                    <span :class="getScoreColor(record.finalScore)">{{ record.finalScore }}</span>
                  </template>
                  <span v-else>-</span>
                </template>

                <template v-if="column.key === 'createdAt'">
                  {{ formatDateUTC8(record.createdAt) }}
                </template>

                <template v-if="column.key === 'actions'">
                  <a-button type="text" size="small" @click="openInNewTab(`/essays/${record.id}`)">
                    <template #icon><EyeOutlined /></template>
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-card>

          <!-- 成绩趋势图 -->
          <a-card class="mt-4" v-if="hasEvaluatedSubmissions" style="position: relative;">
            <template #title>成绩趋势</template>

            <div ref="chartWrapper" style="height: 350px; position: relative;">
              <!-- 图表画布区域 -->
              <div style="height: 100%; overflow-x: auto; overflow-y: hidden; position: relative;">
                <div ref="chartContainer" :style="{ width: chartContainerWidth + 'px', height: '100%', position: 'relative' }">
                  <canvas
                    ref="chartCanvas"
                    style="height: 100%; cursor: pointer;"
                    @click="handleChartClick"
                    @mousemove="handleChartMouseMove"
                    @mouseleave="handleChartMouseLeave"
                  ></canvas>
                </div>
              </div>

              <!-- 悬浮层：提示框和日期标签 -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: visible;">
                <!-- 自定义提示框 - fixed 定位 -->
                <div
                  v-if="tooltipVisible"
                  :style="{
                    position: 'fixed',
                    left: fixedTooltipPosition.x + 'px',
                    top: fixedTooltipPosition.y + 'px',
                    transform: 'translate(-50%, -100%)',
                    zIndex: 10000
                  }"
                  class="chart-tooltip"
                >
                  <div class="tooltip-content">
                    <div class="tooltip-title">{{ tooltipData.title }}</div>
                    <div class="tooltip-score">分数: <span :class="getScoreColor(tooltipData.score)">{{ tooltipData.score }}</span></div>
                    <div class="tooltip-date">时间: {{ tooltipData.date }}</div>
                    <div class="tooltip-hint">点击查看详情</div>
                  </div>
                </div>

                <!-- 横轴日期标签 - absolute 定位，相对于图表容器，垂直显示 -->
                <div
                  v-for="(label, index) in xAxisLabels"
                  :key="index"
                  :style="{
                    position: 'absolute',
                    left: label.x + 'px',
                    bottom: '10px',
                    transform: 'translateX(-50%) rotate(-90deg)',
                    transformOrigin: 'center top',
                    color: label.isHovered ? '#1890ff' : '#666',
                    fontWeight: label.isHovered ? 'bold' : 'normal',
                    fontSize: label.isHovered ? '12px' : '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 9999,
                    pointerEvents: 'none'
                  }"
                >
                  {{ label.text }}
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 编辑学生对话框 -->
      <a-modal
        v-model:open="editDialog"
        title="编辑学生信息"
        :confirm-loading="saving"
        @ok="saveStudent"
        @cancel="editDialog = false"
        width="600px"
      >
        <a-form ref="form" :model="editedItem" layout="vertical">
          <a-form-item
            label="姓名"
            name="name"
            :rules="[{ required: true, message: '姓名不能为空' }]"
          >
            <a-input v-model:value="editedItem.name" />
          </a-form-item>

          <a-form-item
            label="学号"
            name="studentId"
          >
            <a-input v-model:value="editedItem.studentId" />
          </a-form-item>

          <a-form-item
            label="班级"
            name="classId"
          >
            <a-select
              v-model:value="editedItem.classId"
              :options="classOptions"
              show-search
              :filter-option="filterOption"
              :loading="loadingClasses"
              allowClear
            />
            
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons-vue'
import { submissionSummary, getClasses, updateStudent, getClassById, getStudents } from '@/services/apiService'
import { formatDateUTC8 } from '@/composables/useDateFormat'

const route = useRoute()
const router = useRouter()
const studentId = computed(() => (route.params as { id: string }).id)

// 状态变量
const student = ref<any>({
  id: '',
  name: '',
  studentId: '',
  classId: '',
  className: '',
  phone: '',
  email: ''
})
const submissions = ref<any[]>([])
const submissionSummaries = ref<any[]>([])
const classes = ref<any[]>([])
const loading = ref(true)
const loadingSubmissions = ref(true)
const loadingClasses = ref(true)
const error = ref('')
const editDialog = ref(false)
const saving = ref(false)
const form = ref<any>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartContainer = ref<HTMLDivElement | null>(null)
const chartWrapper = ref<HTMLDivElement | null>(null)
const chartContainerWidth = ref(0)
const tooltipVisible = ref(false)
const tooltipData = ref<any>({})
const tooltipPosition = ref({ x: 0, y: 0 })
const fixedTooltipPosition = ref({ x: 0, y: 0 })
const chartPoints = ref<{x: number, y: number, data: any}[]>([])
const xAxisLabels = ref<{x: number, text: string, isHovered: boolean}[]>([])
const hoveredPointIndex = ref<number>(-1)

// 编辑项
const editedItem = ref<any>({
  name: '',
  studentId: '',
  classId: '',
  phone: '',
  email: ''
})

// 班级选项
const classOptions = computed(() => {
  return classes.value.map(cls => ({
    label: cls.name,
    value: cls.id
  }))
})

// 搜索过滤函数
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase())
}

// 表格列定义
const columns = [
  { title: '测验题目', dataIndex: 'titleContext', key: 'titleContext', sorter: (a: any, b: any) => (a.titleContext || '').localeCompare(b.titleContext || '') },
  { title: '状态', key: 'isError', sorter: (a: any, b: any) => (a.isError === b.isError) ? 0 : (a.isError ? 1 : -1) },
  { title: '分数', key: 'finalScore', sorter: (a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0) },
  { title: '提交时间', key: 'createdAt', sorter: (a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions' }
]

// 图表数据
const chartData = computed(() => {
  const validSubmissions = submissionSummaries.value
    .filter(s => !s.isError && s.finalScore !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return validSubmissions.map(sub => ({
    date: formatDateUTC8(sub.createdAt),
    score: sub.finalScore,
    title: sub.titleContext || '无标题',
    id: sub.id
  }))
})

// 计算属性：平均分
const averageScore = computed(() => {
  const validSubmissions = submissionSummaries.value.filter(s => !s.isError && s.finalScore !== undefined)
  if (validSubmissions.length === 0) return '-'

  const sum = validSubmissions.reduce((acc, curr) => acc + (curr.finalScore || 0), 0)
  return (sum / validSubmissions.length).toFixed(1)
})

// 计算属性：是否有已评测的提交
const hasEvaluatedSubmissions = computed(() => {
  return submissionSummaries.value.some(s => !s.isError && s.finalScore !== undefined)
})

// 获取学生详情
async function fetchStudentDetails() {
  loading.value = true
  error.value = ''

  try {
    // 使用 getStudents 获取所有学生，然后通过 id 查找特定学生
    const allStudents = await getStudents({});
    const studentData = allStudents.find(s => s.id === studentId.value);

    if (!studentData) {
      error.value = '未找到学生信息'
      return
    }

    // 获取班级信息
    let className = ''
    if (studentData.classId) {
      try {
        const classResponse = await getClassById(studentData.classId);
        className = classResponse?.name || '';
      } catch (err) {
        console.error('获取班级信息失败:', err)
      }
    }

    student.value = {
      ...studentData,
      className
    }

    // 初始化编辑项
    editedItem.value = {
      name: student.value.name,
      studentId: student.value.studentId,
      classId: student.value.classId,
      phone: student.value.phone,
      email: student.value.email
    }

    // 获取作文提交摘要列表
    await fetchSubmissionSummaries()

    // 获取班级列表
    await fetchClasses()

  } catch (err: any) {
    console.error('获取学生详情失败:', err)
    error.value = err.response?.data?.message || '获取学生详情失败'
  } finally {
    loading.value = false
  }
}

// 获取作文提交摘要列表
async function fetchSubmissionSummaries() {
  loadingSubmissions.value = true

  try {
    const data = await submissionSummary(studentId.value);
    submissionSummaries.value = data || [];
  } catch (err) {
    console.error('获取作文提交摘要列表失败:', err)
  } finally {
    loadingSubmissions.value = false
  }
}

// 获取班级列表
async function fetchClasses() {
  loadingClasses.value = true

  try {
    const data = await getClasses();
    classes.value = data || [];
  } catch (err) {
    console.error('获取班级列表失败:', err)
  } finally {
    loadingClasses.value = false
  }
}

// 保存学生信息
async function saveStudent() {
  try {
    await form.value.validate();
  } catch (error) {
    return;
  }

  saving.value = true
  try {
    await updateStudent(student.value.id, editedItem.value);

    // 关闭对话框并刷新数据
    editDialog.value = false
    await fetchStudentDetails()
  } catch (err: any) {
    console.error('保存学生信息失败:', err)
    alert(err.response?.data?.message || '保存学生信息失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 获取姓名首字母
function getInitials(name: string) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 获取分数颜色
function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-500'
  if (score >= 80) return 'text-blue-500'
  if (score >= 60) return 'text-orange-500'
  return 'text-red-500'
}

// 绘制图表
function drawChart() {
  const canvas = chartCanvas.value
  const container = chartContainer.value
  if (!canvas || !container) return

  const data = chartData.value
  if (data.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 基础参数
  const basePadding = { top: 20, right: 80, bottom: 40, left: 80 } // 减少底部padding，因为使用浮动布局的HTML标签
  const minHeight = 350 // 增加容器高度以容纳浮动标签
  const minPointSpacing = 80 // 每个数据点之间的最小间距

  // 计算所需的最小宽度
  const minRequiredWidth = basePadding.left + basePadding.right + (data.length - 1) * minPointSpacing

  // 获取父容器的实际宽度
  const parentWidth = container.parentElement?.clientWidth || 800

  // 设置容器宽度（至少显示所有数据点，或父容器宽度）
  const containerWidth = Math.max(parentWidth, minRequiredWidth)
  chartContainerWidth.value = containerWidth

  // 设置canvas尺寸
  const rect = container.getBoundingClientRect()
  canvas.width = containerWidth * 2
  canvas.height = minHeight * 2
  ctx.scale(2, 2)

  const width = containerWidth
  const height = minHeight
  const padding = basePadding

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制网格线和坐标轴
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 1

  // 计算数据的最大值和最小值
  const scores = data.map(item => item.score)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)

  // 向上取整到十位作为 Y 轴最大值
  const yAxisMax = Math.ceil(maxScore / 10) * 10
  // 向下取整到十位作为 Y 轴最小值
  const yAxisMin = Math.floor(minScore / 10) * 10

  // Y 轴范围
  const yAxisRange = yAxisMax - yAxisMin

  // Y轴网格线（7条线，6个间隔）
  for (let i = 0; i < 7; i++) {
    const y = padding.top + (chartHeight * i) / 6
    const score = yAxisMax - (yAxisRange * i) / 6

    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    // Y轴标签
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(score.toFixed(0).toString(), padding.left - 10, y + 4)
  }

  // 计算数据点的位置
  const pointPositions: {x: number, y: number, data: any}[] = []

  data.forEach((item, index) => {
    const x = padding.left + (chartWidth * index) / (data.length - 1 || 1)
    // 使用动态的 Y 轴范围计算位置
    const normalizedScore = (item.score - yAxisMin) / yAxisRange
    const y = padding.top + chartHeight - normalizedScore * chartHeight
    pointPositions.push({ x, y, data: item })
  })

  chartPoints.value = pointPositions

  // 绘制折线
  if (pointPositions.length > 0) {
    ctx.beginPath()
    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    pointPositions.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()

    // 绘制数据点
    pointPositions.forEach((point, index) => {
      ctx.beginPath()
      // 悬停时放大数据点
      const radius = index === hoveredPointIndex.value ? 9 : 6
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = '#1890ff'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // 悬停时添加阴影效果
      if (index === hoveredPointIndex.value) {
        ctx.shadowColor = 'rgba(24, 144, 255, 0.5)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(24, 144, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })
  }

  // X轴标签（竖向显示）- 使用 HTML 元素，浮动在 canvas 外部
  const labels: {x: number, text: string, isHovered: boolean}[] = []
  data.forEach((item, index) => {
    const x = padding.left + (chartWidth * index) / (data.length - 1 || 1)
    labels.push({
      x,
      text: item.date,
      isHovered: index === hoveredPointIndex.value
    })
  })
  xAxisLabels.value = labels
}

// 处理图表点击
function handleChartClick(event: MouseEvent) {
  const canvas = chartCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 检查是否点击了某个数据点附近
  for (let i = 0; i < chartPoints.value.length; i++) {
    const point = chartPoints.value[i]
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
    if (distance < 15) {
      openInNewTab(`/essays/${point.data.id}`)
      return
    }
  }
}

// 处理鼠标移动
function handleChartMouseMove(event: MouseEvent) {
  const canvas = chartCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  let foundIndex = -1

  // 检查鼠标是否在某个数据点附近
  for (let i = 0; i < chartPoints.value.length; i++) {
    const point = chartPoints.value[i]
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
    if (distance < 15) {
      foundIndex = i
      break
    }
  }

  // 如果悬停状态改变，重新绘制图表
  if (foundIndex !== hoveredPointIndex.value) {
    hoveredPointIndex.value = foundIndex
    drawChart()
  }

  // 显示或隐藏提示框
  if (foundIndex !== -1) {
    const point = chartPoints.value[foundIndex]
    tooltipVisible.value = true
    tooltipData.value = point.data

    // 计算 fixed 定位的坐标（相对于视口）
    const wrapperRect = chartWrapper.value?.getBoundingClientRect()
    if (wrapperRect) {
      fixedTooltipPosition.value = {
        x: wrapperRect.left + point.x,
        y: wrapperRect.top + point.y - 15
      }
    }
  } else {
    tooltipVisible.value = false
  }
}

// 处理鼠标离开
function handleChartMouseLeave() {
  if (hoveredPointIndex.value !== -1) {
    hoveredPointIndex.value = -1
    tooltipVisible.value = false
    drawChart()
  }
}

// 监听数据变化重新绘制图表
watch(submissionSummaries, () => {
  nextTick(() => drawChart())
}, { deep: true })

// 窗口大小变化时重新绘制图表
window.addEventListener('resize', drawChart)

// 保留原有数据加载逻辑
onMounted(async () => {
  await fetchStudentDetails()
  nextTick(() => drawChart())
})

function openInNewTab(path: string) {
  window.open(path, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
/* 自定义滚动条样式 */
:deep(.ant-card-body > div[style*="overflow-x"]) {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

:deep(.ant-card-body > div[style*="overflow-x"])::-webkit-scrollbar {
  height: 8px;
}

:deep(.ant-card-body > div[style*="overflow-x"])::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

:deep(.ant-card-body > div[style*="overflow-x"])::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

:deep(.ant-card-body > div[style*="overflow-x"])::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.chart-tooltip {
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  min-width: 180px;
}

.tooltip-content {
  color: #fff;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  word-break: break-word;
  max-width: 200px;
}

.tooltip-score {
  font-size: 13px;
  margin-bottom: 4px;
}

.tooltip-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.tooltip-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  font-style: italic;
}
</style>
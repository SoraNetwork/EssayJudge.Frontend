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
          <a-card class="mt-4" v-if="hasEvaluatedSubmissions">
            <template #title>成绩趋势</template>

            <div style="height: 300px; position: relative;">
              <canvas
                ref="chartCanvas"
                style="width: 100%; height: 100%; cursor: pointer;"
                @click="handleChartClick"
                @mousemove="handleChartMouseMove"
                @mouseleave="handleChartMouseLeave"
              ></canvas>
              <!-- 自定义提示框 -->
              <div
                v-if="tooltipVisible"
                :style="{
                  position: 'absolute',
                  left: tooltipPosition.x + 'px',
                  top: tooltipPosition.y + 'px',
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'none',
                  zIndex: 1000
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
const tooltipVisible = ref(false)
const tooltipData = ref<any>({})
const tooltipPosition = ref({ x: 0, y: 0 })
const chartPoints = ref<{x: number, y: number, data: any}[]>([])
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
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  ctx.scale(2, 2)

  const width = rect.width
  const height = rect.height
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }

  const data = chartData.value
  if (data.length === 0) return

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制网格线和坐标轴
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 1

  // Y轴网格线 (0-100分，每20分一条线)
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight * i) / 5
    const score = 100 - i * 20

    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    // Y轴标签
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(score.toString(), padding.left - 10, y + 4)
  }

  // 计算数据点的位置
  const pointPositions: {x: number, y: number, data: any}[] = []

  data.forEach((item, index) => {
    const x = padding.left + (chartWidth * index) / (data.length - 1 || 1)
    const y = padding.top + chartHeight - (item.score / 100) * chartHeight
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

  // X轴标签
  ctx.fillStyle = '#666'
  ctx.font = '11px Arial'
  ctx.textAlign = 'center'

  data.forEach((item, index) => {
    const x = padding.left + (chartWidth * index) / (data.length - 1 || 1)
    // 悬停时高亮标签
    if (index === hoveredPointIndex.value) {
      ctx.fillStyle = '#1890ff'
      ctx.font = 'bold 12px Arial'
    } else {
      ctx.fillStyle = '#666'
      ctx.font = '11px Arial'
    }
    ctx.fillText(item.date, x, height - padding.bottom + 20)
  })
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
    tooltipPosition.value = {
      x: point.x,
      y: point.y - 15
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
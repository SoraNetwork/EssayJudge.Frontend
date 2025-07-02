<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">作文管理</h1>
      <v-btn color="primary" to="/essays/upload" prepend-icon="mdi-upload">
        上传批改
      </v-btn>
    </div>

    <!-- 筛选条件 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.assignmentId"
              label="测验题目"
              :items="assignments"
              item-title="title"
              item-value="id"
              clearable
              @update:model-value="fetchEssays"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.studentId"
              label="学生"
              :items="students"
              item-title="name"
              item-value="id"
              clearable
              @update:model-value="fetchEssays"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" @click="fetchEssays" prepend-icon="mdi-refresh">
              刷新
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 作文列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="essays"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.finalScore="{ item }">
            <v-chip
              :color="getScoreColor(item.finalScore)"
              text-color="white"
              v-if="item.finalScore !== null && item.finalScore !== undefined"
            >
              {{ item.finalScore }}
            </v-chip>
            <span v-else>未评分</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :to="`/essays/${item.id}`"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="primary"
              @click="submitForEvaluation(item)"
              :disabled="item.finalScore !== null && item.finalScore !== undefined"
              :loading="evaluating === item.id"
            >
              <v-icon>mdi-check-circle</v-icon>
              <v-tooltip activator="parent" location="top">提交评测</v-tooltip>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

// 表格列定义
const headers = [
  { title: '标题', key: 'title' },
  { title: '学生', key: 'studentName' },
  { title: '测验', key: 'assignmentTitle' },
  { title: '分数', key: 'finalScore' },
  { title: '提交时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const essays = ref([])
const assignments = ref([])
const students = ref([])
const loading = ref(false)
const evaluating = ref('')

// 筛选条件
const filters = ref({
  assignmentId: '',
  studentId: ''
})

// 获取所有作文
async function fetchEssays() {
  loading.value = true
  try {
    let url = '/EssaySubmissionSearch'
    const params = new URLSearchParams()
    
    if (filters.value.assignmentId) {
      params.append('assignmentId', filters.value.assignmentId)
    }
    
    if (filters.value.studentId) {
      params.append('studentId', filters.value.studentId)
    }
    
    // 添加参数
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const response = await api.get(url)
    essays.value = response.data || []
  } catch (error) {
    console.error('获取作文列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取所有测验
async function fetchAssignments() {
  try {
    const response = await api.get('/EssayAssignment')
    assignments.value = response.data || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
  }
}

// 获取所有学生
async function fetchStudents() {
  try {
    const response = await api.get('/Student')
    students.value = response.data || []
  } catch (error) {
    console.error('获取学生列表失败:', error)
  }
}

// 提交作文评测
async function submitForEvaluation(item: any) {
  evaluating.value = item.id
  try {
    await api.post(`/EssaySubmission/${item.id}/evaluate`)
    // 刷新作文列表
    await fetchEssays()
  } catch (error) {
    console.error('提交评测失败:', error)
  } finally {
    evaluating.value = ''
  }
}

// 根据分数获取颜色
function getScoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return 'grey'
  if (score >= 90) return 'success'
  if (score >= 80) return 'info'
  if (score >= 60) return 'warning'
  return 'error'
}

// 格式化日期为东八区时间
function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai' // 指定东八区时区
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchEssays()
  fetchAssignments()
  fetchStudents()
})
</script>
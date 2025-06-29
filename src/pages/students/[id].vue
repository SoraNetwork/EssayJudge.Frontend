<template>
  <div>
    <v-btn class="mb-4" prepend-icon="mdi-arrow-left" variant="text" :to="'/students'">返回学生列表</v-btn>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    
    <div v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <h2 class="text-h5 text-error">{{ error }}</h2>
      <v-btn class="mt-4" color="primary" :to="'/students'">返回学生列表</v-btn>
    </div>
    
    <div v-else>
      <v-row>
        <!-- 学生信息卡片 -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-text class="text-center pt-6">
              <v-avatar size="120" color="primary" class="mb-4">
                <span class="text-h4 text-white">{{ getInitials(student.name) }}</span>
              </v-avatar>
              
              <h2 class="text-h5 mb-1">{{ student.name }}</h2>
              <p class="text-subtitle-1 text-medium-emphasis mb-4">{{ student.className || '未分配班级' }}</p>
              
              <v-divider class="mb-4"></v-divider>
              
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-account</v-icon>
                  </template>
                  <v-list-item-title>学号</v-list-item-title>
                  <v-list-item-subtitle>{{ student.studentId || '未设置' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-phone</v-icon>
                  </template>
                  <v-list-item-title>联系电话</v-list-item-title>
                  <v-list-item-subtitle>{{ student.phone || '未设置' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-email</v-icon>
                  </template>
                  <v-list-item-title>电子邮箱</v-list-item-title>
                  <v-list-item-subtitle>{{ student.email || '未设置' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <v-divider class="my-4"></v-divider>
              
              <v-btn
                block
                color="primary"
                prepend-icon="mdi-pencil"
                @click="editDialog = true"
                class="mb-2"
              >
                编辑学生信息
              </v-btn>
            </v-card-text>
          </v-card>
          
          <!-- 统计卡片 -->
          <v-row class="mt-4">
            <v-col cols="6">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ submissions.length }}</div>
                  <div class="text-subtitle-2">作文提交</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="6">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ averageScore }}</div>
                  <div class="text-subtitle-2">平均分</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
        
        <!-- 作文提交列表 -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>作文提交历史</v-card-title>
            
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="submissions"
                :loading="loadingSubmissions"
                loading-text="加载中..."
                no-data-text="暂无作文提交"
              >
                <template v-slot:item.assignmentTitle="{ item }">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <span v-bind="props" class="text-truncate d-inline-block" style="max-width: 200px">
                        {{ item.assignmentTitle }}
                      </span>
                    </template>
                    <span>{{ item.assignmentTitle }}</span>
                  </v-tooltip>
                </template>
                
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    variant="outlined"
                    size="small"
                  >
                    {{ getStatusText(item.status) }}
                  </v-chip>
                </template>
                
                <template v-slot:item.score="{ item }">
                  <template v-if="item.status === 'Evaluated'">
                    <span :class="getScoreColor(item.score)">{{ item.score }}</span>
                  </template>
                  <span v-else>-</span>
                </template>
                
                <template v-slot:item.submissionDate="{ item }">
                  {{ formatDate(item.submissionDate) }}
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
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
          
          <!-- 成绩趋势图 -->
          <v-card class="mt-4" v-if="hasEvaluatedSubmissions">
            <v-card-title>成绩趋势</v-card-title>
            
            <v-card-text>
              <v-sheet height="300">
                <!-- 这里可以集成图表库，如Chart.js或Echarts -->
                <!-- 简单起见，这里使用v-sparkline作为示例 -->
                <v-sparkline
                  :value="scoreHistory"
                  :gradient="['#1867C0', '#5CBBF6']"
                  :smooth="10"
                  :padding="8"
                  :line-width="2"
                  stroke-linecap="round"
                  gradient-direction="top"
                  auto-draw
                  auto-line-width
                  show-labels
                  :label-size="5"
                ></v-sparkline>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- 编辑学生对话框 -->
      <v-dialog v-model="editDialog" max-width="600px">
        <v-card>
          <v-card-title class="text-h5">编辑学生信息</v-card-title>
          
          <v-card-text>
            <v-form ref="form" @submit.prevent="saveStudent">
              <v-text-field
                v-model="editedItem.name"
                label="姓名"
                :rules="[v => !!v || '姓名不能为空']"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="editedItem.studentId"
                label="学号"
              ></v-text-field>
              
              <v-select
                v-model="editedItem.classId"
                :items="classes"
                item-title="name"
                item-value="id"
                label="班级"
                clearable
                :loading="loadingClasses"
              ></v-select>
              
              <v-text-field
                v-model="editedItem.phone"
                label="联系电话"
              ></v-text-field>
              
              <v-text-field
                v-model="editedItem.email"
                label="电子邮箱"
                :rules="[v => !v || /.+@.+\..+/.test(v) || '请输入有效的邮箱地址']"
              ></v-text-field>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="editDialog = false">取消</v-btn>
            <v-btn color="primary" @click="saveStudent" :loading="saving">保存</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const studentId = computed(() => route.params.id as string)

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
const classes = ref<any[]>([])
const loading = ref(true)
const loadingSubmissions = ref(true)
const loadingClasses = ref(true)
const error = ref('')
const editDialog = ref(false)
const saving = ref(false)
const form = ref<any>(null)

// 编辑项
const editedItem = ref<any>({
  name: '',
  studentId: '',
  classId: '',
  phone: '',
  email: ''
})

// 表格列定义
const headers = [
  { title: '测验题目', key: 'assignmentTitle' },
  { title: '状态', key: 'status' },
  { title: '分数', key: 'score' },
  { title: '提交时间', key: 'submissionDate' },
  { title: '操作', key: 'actions', sortable: false }
]

// 计算属性：平均分
const averageScore = computed(() => {
  const evaluatedSubmissions = submissions.value.filter(s => s.status === 'Evaluated' && s.score !== undefined)
  if (evaluatedSubmissions.length === 0) return '-'
  
  const sum = evaluatedSubmissions.reduce((acc, curr) => acc + curr.score, 0)
  return (sum / evaluatedSubmissions.length).toFixed(1)
})

// 计算属性：是否有已评测的提交
const hasEvaluatedSubmissions = computed(() => {
  return submissions.value.some(s => s.status === 'Evaluated' && s.score !== undefined)
})

// 计算属性：分数历史
const scoreHistory = computed(() => {
  return submissions.value
    .filter(s => s.status === 'Evaluated' && s.score !== undefined)
    .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())
    .map(s => s.score)
})

// 获取学生详情
async function fetchStudentDetails() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get(`/Student/${studentId.value}`)
    const studentData = response.data
    
    if (!studentData) {
      error.value = '未找到学生信息'
      return
    }
    
    // 获取班级信息
    let className = ''
    if (studentData.classId) {
      try {
        const classResponse = await api.get(`/Class/${studentData.classId}`)
        className = classResponse.data?.name || ''
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
    
    // 获取作文提交列表
    await fetchSubmissions()
    
    // 获取班级列表
    await fetchClasses()
    
  } catch (err: any) {
    console.error('获取学生详情失败:', err)
    error.value = err.response?.data?.message || '获取学生详情失败'
  } finally {
    loading.value = false
  }
}

// 获取作文提交列表
async function fetchSubmissions() {
  loadingSubmissions.value = true
  
  try {
    const response = await api.get(`/EssaySubmissionSearch?studentId=${studentId.value}`)
    const submissionData = response.data || []
    
    // 获取每个提交的测验题目信息
    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      try {
        // 获取测验题目信息
        const assignmentResponse = await api.get(`/EssayAssignment/${submission.assignmentId}`)
        const assignment = assignmentResponse.data
        
        return {
          ...submission,
          assignmentTitle: assignment?.title || '未知题目'
        }
      } catch (err) {
        console.error('获取测验题目信息失败:', err)
        return {
          ...submission,
          assignmentTitle: '未知题目'
        }
      }
    }))
    
    submissions.value = enrichedSubmissions
  } catch (err) {
    console.error('获取作文提交列表失败:', err)
  } finally {
    loadingSubmissions.value = false
  }
}

// 获取班级列表
async function fetchClasses() {
  loadingClasses.value = true
  
  try {
    const response = await api.get('/Class')
    classes.value = response.data || []
  } catch (err) {
    console.error('获取班级列表失败:', err)
  } finally {
    loadingClasses.value = false
  }
}

// 保存学生信息
async function saveStudent() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return
  
  saving.value = true
  try {
    await api.put(`/Student/${student.value.id}`, editedItem.value)
    
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

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态文本
function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    'Submitted': '已提交',
    'Evaluating': '评测中',
    'Evaluated': '已评测'
  }
  return statusMap[status] || status
}

// 获取状态颜色
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    'Submitted': 'info',
    'Evaluating': 'warning',
    'Evaluated': 'success'
  }
  return colorMap[status] || 'grey'
}

// 获取分数颜色
function getScoreColor(score: number) {
  if (score >= 90) return 'text-success'
  if (score >= 80) return 'text-info'
  if (score >= 60) return 'text-warning'
  return 'text-error'
}

// 页面加载时获取数据
onMounted(() => {
  fetchStudentDetails()
})
</script>
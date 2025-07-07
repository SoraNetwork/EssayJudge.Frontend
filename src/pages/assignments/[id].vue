<template>
  <div>
    <v-btn class="mb-4" prepend-icon="mdi-arrow-left" variant="text" :to="'/assignments'">返回测验列表</v-btn>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    
    <div v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <h2 class="text-h5 text-error">{{ error }}</h2>
      <v-btn class="mt-4" color="primary" :to="'/assignments'">返回测验列表</v-btn>
    </div>
    
    <div v-else>
      <!-- 测验信息卡片 -->
      <v-card class="mb-6">
        <v-card-title class="text-h5">{{ assignment.title }}</v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <div class="text-subtitle-1 mb-2">描述</div>
              <p class="text-body-1 mb-4">{{ assignment.description || '无描述' }}</p>
              
              <div class="text-subtitle-1 mb-2">作文提示</div>
              <v-sheet class="pa-4 rounded" color="grey-lighten-4">
                <div class="text-body-1" style="white-space: pre-wrap; line-height: 1.8;">{{ assignment.prompt }}</div>
              </v-sheet>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-text-box-outline</v-icon>
                  </template>
                  <v-list-item-title>字数要求</v-list-item-title>
                  <v-list-item-subtitle>{{ assignment.minWordCount || 0 }} - {{ assignment.maxWordCount || '不限' }} 字</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>创建时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(assignment.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar-clock</v-icon>
                  </template>
                  <v-list-item-title>更新时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(assignment.updatedAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <v-divider class="my-4"></v-divider>
              
              <v-card variant="outlined" class="mb-4">
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ submissions.length }}</div>
                  <div class="text-subtitle-2">作文提交数量</div>
                </v-card-text>
              </v-card>
              
              <v-btn
                block
                color="primary"
                prepend-icon="mdi-pencil"
                @click="editDialog = true"
              >
                编辑测验
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- 作文提交列表 -->
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>作文提交列表</span>
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="搜索学生"
            single-line
            hide-details
            density="compact"
            style="max-width: 300px"
          ></v-text-field>
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :headers="headers"
            :items="filteredSubmissions"
            :loading="loadingSubmissions"
            loading-text="加载中..."
            no-data-text="暂无作文提交"
          >
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
      
      <!-- 编辑测验对话框 -->
      <v-dialog v-model="editDialog" max-width="800px">
        <v-card>
          <v-card-title class="text-h5">编辑测验</v-card-title>
          
          <v-card-text>
            <v-form ref="form" @submit.prevent="saveAssignment">
              <v-text-field
                v-model="editedItem.title"
                label="标题"
                :rules="[v => !!v || '标题不能为空']"
                required
              ></v-text-field>
              
              <v-textarea
                v-model="editedItem.description"
                label="描述"
                rows="2"
              ></v-textarea>
              
              <v-textarea
                v-model="editedItem.prompt"
                label="作文提示"
                :rules="[v => !!v || '作文提示不能为空']"
                rows="5"
                required
              ></v-textarea>
              
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.minWordCount"
                    label="最小字数"
                    type="number"
                    min="0"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.maxWordCount"
                    label="最大字数"
                    type="number"
                    min="0"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="editDialog = false">取消</v-btn>
            <v-btn color="primary" @click="saveAssignment" :loading="saving">保存</v-btn>
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
// Assert that route.params has an 'id' property of type string
const assignmentId = computed(() => (route.params as { id: string }).id)

// 状态变量
const assignment = ref<any>({
  id: '',
  title: '',
  description: '',
  prompt: '',
  minWordCount: 0,
  maxWordCount: 0,
  createdAt: '',
  updatedAt: ''
})
const submissions = ref<any[]>([])
const loading = ref(true)
const loadingSubmissions = ref(true)
const error = ref('')
const editDialog = ref(false)
const saving = ref(false)
const search = ref('')
const form = ref<any>(null)

// 编辑项
const editedItem = ref<any>({
  title: '',
  description: '',
  prompt: '',
  minWordCount: 0,
  maxWordCount: 0
})

// 表格列定义
const headers = [
  { title: '学生', key: 'studentName' },
  { title: '班级', key: 'className' },
  { title: '状态', key: 'status' },
  { title: '分数', key: 'score' },
  { title: '提交时间', key: 'submissionDate' },
  { title: '操作', key: 'actions', sortable: false }
]

// 过滤后的提交列表
const filteredSubmissions = computed(() => {
  if (!search.value) return submissions.value
  
  const searchTerm = search.value.toLowerCase()
  return submissions.value.filter(submission => {
    return submission.studentName.toLowerCase().includes(searchTerm) ||
           (submission.className && submission.className.toLowerCase().includes(searchTerm))
  })
})

// 获取测验详情
async function fetchAssignmentDetails() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get(`/EssayAssignment/${assignmentId.value}`)
    assignment.value = response.data
    
    if (!assignment.value) {
      error.value = '未找到测验信息'
      return
    }
    
    // 初始化编辑项
    editedItem.value = {
      title: assignment.value.title,
      description: assignment.value.description,
      prompt: assignment.value.prompt,
      minWordCount: assignment.value.minWordCount,
      maxWordCount: assignment.value.maxWordCount
    }
    
    // 获取作文提交列表
    await fetchSubmissions()
    
  } catch (err: any) {
    console.error('获取测验详情失败:', err)
    error.value = err.response?.data?.message || '获取测验详情失败'
  } finally {
    loading.value = false
  }
}

// 获取作文提交列表
async function fetchSubmissions() {
  loadingSubmissions.value = true
  
  try {
    const response = await api.get(`/EssaySubmissionSearch?assignmentId=${assignmentId.value}`)
    const submissionData = response.data || []
    
    // 获取每个提交的学生和班级信息
    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      try {
        // 获取学生信息
        const studentResponse = await api.get(`/Student/${submission.studentId}`)
        const student = studentResponse.data
        
        // 获取班级信息
        let className = ''
        if (student && student.classId) {
          try {
            const classResponse = await api.get(`/Class/${student.classId}`)
            className = classResponse.data?.name || ''
          } catch (err) {
            console.error('获取班级信息失败:', err)
          }
        }
        
        return {
          ...submission,
          studentName: student?.name || '未知学生',
          className: className || '未分配班级'
        }
      } catch (err) {
        console.error('获取学生信息失败:', err)
        return {
          ...submission,
          studentName: '未知学生',
          className: '未知班级'
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

// 保存测验
async function saveAssignment() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return
  
  saving.value = true
  try {
    await api.put(`/EssayAssignment/${assignment.value.id}`, editedItem.value)
    
    // 关闭对话框并刷新数据
    editDialog.value = false
    await fetchAssignmentDetails()
  } catch (err: any) {
    console.error('保存测验失败:', err)
    alert(err.response?.data?.message || '保存测验失败，请稍后重试')
  } finally {
    saving.value = false
  }
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
  fetchAssignmentDetails()
})
</script>
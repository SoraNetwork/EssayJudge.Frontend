<template>
  <div>
    <v-row v-if="authStore.isAuthenticated">
      <v-col cols="12">
        <h1 class="text-h4 mb-4">欢迎使用作文评测系统</h1>
      </v-col>
      
      <!-- 统计卡片 -->
      <v-col cols="12" md="4">
        <v-card class="mb-4" height="150">
          <v-card-title class="text-h6">
            <v-icon left color="primary" class="mr-2">mdi-book-open-page-variant</v-icon>
            作文题目
          </v-card-title>
          <v-card-text class="d-flex align-center justify-center">
            <div class="text-h3 text-primary" v-if="!loading.assignments">{{ stats.assignmentCount }}</div>
            <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" to="/assignments">查看全部</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="mb-4" height="150">
          <v-card-title class="text-h6">
            <v-icon left color="primary" class="mr-2">mdi-account-group</v-icon>
            学生人数
          </v-card-title>
          <v-card-text class="d-flex align-center justify-center">
            <div class="text-h3 text-primary" v-if="!loading.students">{{ stats.studentCount }}</div>
            <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" to="/students">查看全部</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="mb-4" height="150">
          <v-card-title class="text-h6">
            <v-icon left color="primary" class="mr-2">mdi-clipboard-text</v-icon>
            作文提交
          </v-card-title>
          <v-card-text class="d-flex align-center justify-center">
            <div class="text-h3 text-primary" v-if="!loading.submissions">{{ stats.submissionCount }}</div>
            <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" to="/essays">查看全部</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- 最近作文提交 -->
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon left color="primary" class="mr-2">mdi-history</v-icon>
            最近作文提交
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="recentSubmissions"
              :loading="loading.recentSubmissions"
              loading-text="加载中..."
              no-data-text="暂无数据"
            >
              <template v-slot:item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleString() }}
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
      </v-col>
    </v-row>
    
    <!-- 未登录状态 -->
    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-img
          src="@/assets/logo.svg"
          height="200"
          class="mx-auto mb-6"
          contain
        ></v-img>
        <h1 class="text-h3 mb-6">作文评测系统</h1>
        <p class="text-body-1 mb-6">请登录以使用系统功能</p>
        <v-btn
          color="primary"
          size="large"
          to="/login"
        >
          立即登录
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

// 统计数据
const stats = ref({
  assignmentCount: 0,
  studentCount: 0,
  submissionCount: 0
})

// 加载状态
const loading = ref({
  assignments: false,
  students: false,
  submissions: false,
  recentSubmissions: false
})

// 最近提交的作文
const recentSubmissions = ref([])

// 表格列定义
const headers = [
  { title: '标题', key: 'title' },
  { title: '学生', key: 'studentName' },
  { title: '分数', key: 'finalScore' },
  { title: '提交时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 是否已登录
const isLoggedIn = computed(() => authStore.isAuthenticated)

// 获取统计数据
async function fetchStats() {
  if (!isLoggedIn.value) return
  
  // 获取作文题目数量
  loading.value.assignments = true
  try {
    const response = await api.get('/EssayAssignment')
    stats.value.assignmentCount = response.data.length || 0
  } catch (error) {
    console.error('获取作文题目失败:', error)
  } finally {
    loading.value.assignments = false
  }
  
  // 获取学生数量
  loading.value.students = true
  try {
    const response = await api.get('/Student')
    stats.value.studentCount = response.data.length || 0
  } catch (error) {
    console.error('获取学生数量失败:', error)
  } finally {
    loading.value.students = false
  }
  
  // 获取作文提交数量
  loading.value.submissions = true
  try {
    const response = await api.get('/EssaySubmissionSearch?top=1000')
    stats.value.submissionCount = response.data.length || 0
  } catch (error) {
    console.error('获取作文提交数量失败:', error)
  } finally {
    loading.value.submissions = false
  }
}

// 获取最近提交的作文
async function fetchRecentSubmissions() {
  if (!isLoggedIn.value) return
  
  loading.value.recentSubmissions = true
  try {
    const response = await api.get('/EssaySubmissionSearch?top=5')
    recentSubmissions.value = response.data || []
  } catch (error) {
    console.error('获取最近作文提交失败:', error)
  } finally {
    loading.value.recentSubmissions = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    fetchStats()
    fetchRecentSubmissions()
  }
})
</script>

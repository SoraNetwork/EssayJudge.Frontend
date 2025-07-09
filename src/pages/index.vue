<template>
  <div>
    <v-row v-if="authStore.isAuthenticated">
      <v-col cols="12">
        <h1 class="text-h4 mb-4">欢迎使用作文评测系统</h1>
      </v-col>
      
      <!-- 统计卡片 -->
      <v-col cols="12" md="4">
        <div class="stat-card-hover" @click="goTo('/assignments')">
          <v-card class="mb-4 stat-card" height="150">
            <v-card-title class="text-h6">
              <v-icon left color="primary" class="mr-2">mdi-book-open-page-variant</v-icon>
              作文题目
            </v-card-title>
            <v-card-text class="d-flex align-center justify-center">
              <div class="text-h3 text-primary" v-if="!loading.assignments">{{ stats.assignmentCount }}</div>
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </v-card-text>
            <!-- 遮罩 -->
            <div class="stat-card-mask">
              查看全部
            </div>
          </v-card>
        </div>
      </v-col>
      
      <v-col cols="12" md="4">
        <div class="stat-card-hover" @click="goTo('/students')">
          <v-card class="mb-4 stat-card" height="150">
            <v-card-title class="text-h6">
              <v-icon left color="primary" class="mr-2">mdi-account-group</v-icon>
              学生人数
            </v-card-title>
            <v-card-text class="d-flex align-center justify-center">
              <div class="text-h3 text-primary" v-if="!loading.students">{{ stats.studentCount }}</div>
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </v-card-text>
            <div class="stat-card-mask">
              查看全部
            </div>
          </v-card>
        </div>
      </v-col>
      
      <v-col cols="12" md="4">
        <div class="stat-card-hover" @click="goTo('/essays')">
          <v-card class="mb-4 stat-card" height="150">
            <v-card-title class="text-h6">
              <v-icon left color="primary" class="mr-2">mdi-clipboard-text</v-icon>
              作文提交
            </v-card-title>
            <v-card-text class="d-flex align-center justify-center">
              <div class="text-h3 text-primary" v-if="!loading.submissions">{{ stats.submissionCount }}</div>
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </v-card-text>
            <div class="stat-card-mask">
              查看全部
            </div>
          </v-card>
        </div>
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
import { getAssignments, getStudents, searchSubmissions, type Submission } from '@/services/apiService'; // Import from apiService
import { useRouter } from 'vue-router'

// Loading states
const loading = ref({
  assignments: false,
  students: false,
  submissions: false,
  recentSubmissions: false
})

const authStore = useAuthStore()
const router = useRouter()

// 统计数据
const stats = ref({
  assignmentCount: 0,
  studentCount: 0, // Add studentCount
  submissionCount: 0 // Add submissionCount
})

// 最近提交的作文
const recentSubmissions = ref<Submission[]>([])

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
    // Replace api.get with getAssignments
    const data = await getAssignments();
    stats.value.assignmentCount = data.length || 0
  } catch (error) {
    console.error('获取作文题目失败:', error)
  } finally {
    loading.value.assignments = false
  }

  // 获取学生数量
  loading.value.students = true
  try {
    // Replace api.get with getStudents
    const data = await getStudents({}); // Pass empty filters
    stats.value.studentCount = data.length || 0
  } catch (error) {
    console.error('获取学生数量失败:', error)
  } finally {
    loading.value.students = false
  }

  // 获取作文提交数量
  loading.value.submissions = true
  try {
    // Replace api.get with searchSubmissions
    const data = await searchSubmissions({ top: 1000 }); // Pass top filter
    stats.value.submissionCount = data.length || 0
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
    // Replace api.get with searchSubmissions
    const data = await searchSubmissions({ top: 5 }); // Pass top filter
    recentSubmissions.value = data || []
  } catch (error) {
    console.error('获取最近作文提交失败:', error)
  } finally {
    loading.value.recentSubmissions = false
  }
}

function goTo(path: string) {
  router.push(path)
}

onMounted(() => {
  if (isLoggedIn.value) {
    fetchStats()
    fetchRecentSubmissions()
  }
})
</script>

<style scoped>
.stat-card-hover {
  position: relative;
  cursor: pointer;
}
.stat-card-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(25, 118, 210, 0.75);
  color: #fff;
  font-size: 1.3em;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  border-radius: 8px;
  transition: opacity 0.2s;
  z-index: 2;
}
.stat-card-hover:hover .stat-card-mask {
  opacity: 1;
  pointer-events: auto;
}
.stat-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
</style>

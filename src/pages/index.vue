<template>
  <div class="dashboard-container" v-if="authStore.isAuthenticated">
    <h1 class="dashboard-title">欢迎使用作文评测系统</h1>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]">
      <a-col :span="24" :md="8">
        <div class="stat-card-wrapper" @click="goTo('/assignments')">
          <a-card class="stat-card" hoverable>
            <template #title>
              <span><BookOutlined /> 作文题目</span>
            </template>
            <div class="stat-content" v-if="!loading.assignments">{{ stats.assignmentCount }}</div>
            <a-spin v-else size="large" class="stat-content" />
          </a-card>
        </div>
      </a-col>

      <a-col :span="24" :md="8">
        <div class="stat-card-wrapper" @click="goTo('/students')">
          <a-card class="stat-card" hoverable>
            <template #title>
              <span><TeamOutlined /> 学生人数</span>
            </template>
            <div class="stat-content" v-if="!loading.students">{{ stats.studentCount }}</div>
            <a-spin v-else size="large" class="stat-content" />
          </a-card>
        </div>
      </a-col>

      <a-col :span="24" :md="8">
        <div class="stat-card-wrapper" @click="goTo('/essays')">
          <a-card class="stat-card" hoverable>
            <template #title>
              <span><FileTextOutlined /> 作文提交</span>
            </template>
            <div class="stat-content" v-if="!loading.submissions">{{ stats.submissionCount }}</div>
            <a-spin v-else size="large" class="stat-content" />
          </a-card>
        </div>
      </a-col>
    </a-row>

    <!-- 最近作文提交 -->
    <a-card class="mt-4" title="最近作文提交" :headStyle="{ color: '#1890ff' }">
      <template #extra>
        <a-button type="link" @click="goTo('/essays')">查看全部</a-button>
      </template>
      <a-table
        :columns="columns"
        :data-source="recentSubmissions"
        :loading="loading.recentSubmissions"
        :scroll="{ x: 768 }"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatDateUTC8(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" @click="goTo(`/essays/${record.id}`)">查看</a-button>
          </template>
          <template v-else-if="column.dataIndex === 'finalScore' && record.finalScore">
            <a-tag color="blue">{{ record.finalScore }}</a-tag>
          </template>
          <template v-else>
            {{ text }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>

  <!-- 未登录状态 -->
  <div class="welcome-container" v-else>
    <div class="welcome-content">
      <img src="https://static.wikia.nocookie.net/minecraft_zh_gamepedia/images/5/55/Enchanted_Book.gif" alt="Enchanted Book" class="welcome-image" />
      <h1 class="welcome-title">作文评测系统</h1>
      <p class="welcome-subtitle">请登录以使用系统功能</p>
      <a-button type="primary" size="large" @click="goTo('/login')" class="welcome-btn">立即登录</a-button>
      <a-button type="default" size="large" @click="goTo('/essay/upload')" class="welcome-btn ml-4">学生作文上传</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAssignments, getStudents, searchSubmissions, type Submission } from '@/services/apiService'; // Import from apiService
import { useRouter } from 'vue-router'
import { formatDateUTC8 } from '@/utils/dateUtils';

// Ant Design 组件
import { BookOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons-vue';

const authStore = useAuthStore()
const router = useRouter()

// Loading states
const loading = ref({
  assignments: false,
  students: false,
  submissions: false,
  recentSubmissions: false
})

// 统计数据
const stats = ref({
  assignmentCount: 0,
  studentCount: 0,
  submissionCount: 0
})

// 最近提交的作文
const recentSubmissions = ref<Submission[]>([])

// 表格列定义
const columns = [
  { title: '标题', dataIndex: 'title', key: 'title', sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || '') },
  { title: '学生', dataIndex: 'studentName', key: 'studentName', sorter: (a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || '') },
  { title: '分数', dataIndex: 'finalScore', key: 'finalScore', sorter: (a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0) },
  { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', sorter: (a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions', width: 100 }
]

// 是否已登录
const isLoggedIn = computed(() => authStore.isAuthenticated)

// 获取统计数据
async function fetchStats() {
  if (!isLoggedIn.value) return

  // 获取作文题目数量
  loading.value.assignments = true
  try {
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
    const data = await getStudents({});
    stats.value.studentCount = data.length || 0
  } catch (error) {
    console.error('获取学生数量失败:', error)
  } finally {
    loading.value.students = false
  }

  // 获取作文提交数量
  loading.value.submissions = true
  try {
    const data = await searchSubmissions({ top: 1000 });
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
    const data = await searchSubmissions({ top: 5 });
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
.dashboard-container {
  padding: 24px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #1f2d3d;
}

.stat-card-wrapper {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card-wrapper:hover {
  transform: translateY(-5px);
}

.stat-card {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.stat-content {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.welcome-content {
  text-align: center;
}

.welcome-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #1f2d3d;
}

.welcome-subtitle {
  font-size: 16px;
  color: #606266;
  margin-bottom: 24px;
}

.welcome-btn {
  margin: 0 8px;
}

.ml-4 {
  margin-left: 16px;
}
</style>

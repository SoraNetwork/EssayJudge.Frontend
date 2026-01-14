<template>
  <div>
    <!-- 返回按钮 -->
    <v-btn class="mb-4" prepend-icon="mdi-arrow-left" variant="text" :to="'/assignments'">返回测验列表</v-btn>

    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <h2 class="text-h5 text-error">{{ error }}</h2>
      <v-btn class="mt-4" color="primary" :to="'/assignments'">返回测验列表</v-btn>
    </div>

    <!-- 主要内容 -->
    <div v-else>
      <!-- 测验信息卡片 -->
      <v-card class="mb-6">
        <v-card-title class="text-h5">{{ assignment.description }}</v-card-title>

        <v-card-text>
          <v-row>
            <!-- 作文题目 -->
            <v-col cols="12" md="8">
              <div class="text-subtitle-1 mb-2">作文题目</div>
              <v-sheet class="pa-4 rounded" color="grey-lighten-4">
                <div class="text-body-1" style="white-space: pre-wrap; line-height: 1.8;">
                  {{ assignment.titleContext }}
                </div>
              </v-sheet>
            </v-col>

            <!-- 评分标准 -->
            <v-col cols="12" md="8">
              <div class="text-subtitle-1 mb-2">评分标准</div>
              <v-sheet class="pa-4 rounded" color="grey-lighten-4">
                <div class="text-body-1" style="white-space: pre-wrap; line-height: 1.8;">{{
                  assignment.scoringCriteria || '未设置评分标准' }}</div>
              </v-sheet>
            </v-col>

            <!-- 测验详细信息 -->
            <v-col cols="12" md="4">
              <v-list>
                <!-- 年级信息 -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-account-star</v-icon>
                  </template>
                  <v-list-item-title>年级</v-list-item-title>
                  <v-list-item-subtitle>{{ assignment.grade || '未设置' }}</v-list-item-subtitle>
                </v-list-item>

                <!-- 分数信息 -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-star-circle</v-icon>
                  </template>
                  <v-list-item-title>总分 / 基础分</v-list-item-title>
                  <v-list-item-subtitle>{{ assignment.totalScore || 'N/A' }} / {{ assignment.baseScore || 'N/A'
                    }}</v-list-item-subtitle>
                </v-list-item>

                <!-- 创建时间 -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>创建时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(assignment.createdAt) }}</v-list-item-subtitle>
                </v-list-item>

                <!-- 更新时间 -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar-clock</v-icon>
                  </template>
                  <v-list-item-title>更新时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(assignment.updatedAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-divider class="my-4"></v-divider>

              <!-- 提交数量统计 -->
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
          <!-- 搜索框 -->
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="搜索学生" single-line hide-details
            density="compact" style="max-width: 300px"></v-text-field>
        </v-card-title>

        <v-card-text>
          <!-- 桌面端表格 -->
          <v-data-table v-if="display.mdAndUp.value" :headers="headers" :items="filteredSubmissions"
            :loading="loadingSubmissions" loading-text="加载中..." no-data-text="暂无作文提交">
            <!-- 分数列 -->
            <template v-slot:item.score="{ item }">
              <template v-if="item.status === 'Evaluated'">
                <span :class="getScoreColor(item.score)">{{ item.score }}</span>
              </template>
              <span v-else>-</span>
            </template>

            <!-- 提交时间列 -->
            <template v-slot:item.submissionDate="{ item }">
              {{ formatDate(item.submissionDate) }}
            </template>

            <!-- 操作列 -->
            <template v-slot:item.actions="{ item }">
              <v-btn icon variant="text" size="small" :to="`/essays/${item.id}`">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>

          <!-- 移动端列表 -->
          <v-list v-else>
            <v-list-item v-for="item in filteredSubmissions" :key="item.id" :to="`/essays/${item.id}`" class="mb-2">
              <v-list-item-content>
                <v-list-item-title>{{ item.studentName || '未知学生' }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.className || '未知班级' }} - {{ formatDate(item.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <template v-slot:append>
                <!-- 分数显示 -->
                <span v-if="item.status === 'Evaluated'" :class="getScoreColor(item.score)"
                  class="ml-2 font-weight-bold">
                  {{ item.score || '未评分' }}
                </span>
                <span v-else>-</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- 编辑测验对话框 -->
      <EditAssignments
        v-model="editDialog"
        :edited-item="editedItem"
        :is-editing="true"
        :saving="saving"
        @update:editedItem="editedItem = $event"
        @save="saveAssignment"
      />
    </div>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
// 导入所需模块
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssignmentById, searchSubmissions, updateAssignment } from '@/services/apiService';
import EditAssignments from '@/components/EditAssignments.vue';

// Responsive display detection (Vuetify-independent)
const windowWidth = ref(window.innerWidth)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const display = computed(() => ({
  mdAndUp: { value: windowWidth.value >= 768 }
}))

// 获取路由和路由器实例
const route = useRoute()
const router = useRouter()
// 断言 route.params 具有字符串类型的 'id' 属性
const assignmentId = computed(() => (route.params as { id: string }).id)

// 状态变量定义
const assignment = ref<any>({
  id: '',
  titleContext: '',
  grade: null,
  totalScore: null,
  baseScore: null,
  scoringCriteria: '',
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
  id: '',
  grade: null,
  titleContext: '',
  description: '',
  totalScore: null,
  baseScore: null,
  scoringCriteria: '',
})

// 表格列定义
const headers = [
  { title: '学生', key: 'studentName' },
  { title: '班级', key: 'className' },
  { title: '分数', key: 'finalScore' },
  { title: '提交时间', key: 'createdAt' },
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
    const data = await getAssignmentById(assignmentId.value);
    assignment.value = data;

    if (!assignment.value) {
      error.value = '未找到测验信息'
      return
    }

    // 初始化编辑项
    editedItem.value = {
      id: assignment.value.id,
      titleContext: assignment.value.titleContext,
      description: assignment.value.description,
      grade: assignment.value.grade,
      totalScore: assignment.value.totalScore,
      baseScore: assignment.value.baseScore,
      scoringCriteria: assignment.value.scoringCriteria,
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
    const submissionData = await searchSubmissions({ assignmentId: assignmentId.value });

    // 获取每个提交的学生和班级信息 (这部分可能需要后端支持或单独的API调用)
    // 假设 searchSubmissions 现在包含 studentName 和 className
    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      // 如果后端不返回 studentName/className，您可能需要:
      // const studentResponse = await api.get(`/Student/${submission.studentId}`);
      // const student = studentResponse.data;
      // let className = '';
      // if (student && student.classId) {
      //   const classResponse = await api.get(`/Class/${student.classId}`);
      //   className = classResponse.data?.name || '';
      // }
      // return { ...submission, studentName: student?.name || '未知学生', className: className || '未分配班级' };
      // 现在假设 searchSubmissions 返回了增强的数据
      return submission; // 假设 searchSubmissions 返回了增强的数据
    }));

    submissions.value = enrichedSubmissions
  } catch (err) {
    console.error('获取作文提交列表失败:', err)
  } finally {
    loadingSubmissions.value = false
  }
}

// 保存测验
async function saveAssignment() {
  saving.value = true
  try {
    await updateAssignment(editedItem.value);

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
  // 假设分数是基于 assignment.value.totalScore 计算的
  if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.8) {
    return 'text-success'; // 高分
  } else if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.6) {
    return 'text-warning'; // 中等分数
  } else {
    return 'text-error'; // 低分
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignmentDetails()
})
</script>
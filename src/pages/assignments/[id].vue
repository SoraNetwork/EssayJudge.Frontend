<template>
  <div style="padding: 24px;">
    <!-- 返回按钮 -->
    <a-button style="margin-bottom: 16px;" type="link" href="/assignments">
      <template #icon><ArrowLeftOutlined /></template>
      返回测验列表
    </a-button>

    <!-- 加载状态 -->
    <div v-if="loading" style="display: flex; justify-content: center; align-items: center; height: 400px;">
      <a-spin size="large" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" style="text-align: center; padding: 32px 0;">
      <ExclamationCircleOutlined style="color: #ff4d4f; font-size: 64px; margin-bottom: 16px;" />
      <h2 style="color: #ff4d4f; font-size: 20px;">{{ error }}</h2>
      <a-button style="margin-top: 16px;" type="primary" href="/assignments">返回测验列表</a-button>
    </div>

    <!-- 主要内容 -->
    <div v-else>
      <!-- 测验信息卡片 -->
      <a-card style="margin-bottom: 24px;">
        <template #title>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>{{ assignment.description }}</span>
          </div>
        </template>

        <a-row :gutter="16">
          <!-- 作文题目 -->
          <a-col :xs="24" :md="16">
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">作文题目</div>
            <transition name="fade" mode="out-in">
              <div v-if="!isEditing" key="view-title" style="padding: 16px; background-color: var(--ant-color-bg-layout); border-radius: 8px;">
                <div style="white-space: pre-wrap; line-height: 1.8;">
                  {{ assignment.titleContext }}
                </div>
              </div>
              <a-textarea
                v-else
                key="edit-title"
                v-model:value="editableTitleContext"
                :rows="6"
                placeholder="作文题目"
                :auto-size="{ minRows: 6, maxRows: 12 }"
              />
            </transition>
          </a-col>

          <!-- 评分标准 -->
          <a-col :xs="24" :md="16">
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">评分标准</div>
            <transition name="fade" mode="out-in">
              <div v-if="!isEditing" key="view-criteria" style="padding: 16px; background-color: var(--ant-color-bg-layout); border-radius: 8px;">
                <div style="white-space: pre-wrap; line-height: 1.8;">
                  {{ assignment.scoringCriteria || '未设置评分标准' }}
                </div>
              </div>
              <a-textarea
                v-else
                key="edit-criteria"
                v-model:value="editableScoringCriteria"
                :rows="6"
                placeholder="评分标准"
                :auto-size="{ minRows: 6, maxRows: 12 }"
              />
            </transition>
          </a-col>

          <!-- 测验详细信息 -->
          <a-col :xs="24" :md="8">
            <transition name="fade" mode="out-in">
              <div v-if="!isEditing" key="view-info">
                <a-list size="small">
                  <!-- 年级信息 -->
                  <a-list-item>
                    <template #prepend>
                      <StarOutlined style="color: #1890ff; margin-right: 8px;" />
                    </template>
                    <a-list-item-meta title="年级" :description="assignment.grade || '未设置'" />
                  </a-list-item>

                  <!-- 分数信息 -->
                  <a-list-item>
                    <template #prepend>
                      <StarFilled style="color: #1890ff; margin-right: 8px;" />
                    </template>
                    <a-list-item-meta title="总分 / 基础分" :description="`${assignment.totalScore || 'N/A'} / ${assignment.baseScore || 'N/A'}`" />
                  </a-list-item>

                  <!-- 创建时间 -->
                  <a-list-item>
                    <template #prepend>
                      <CalendarOutlined style="color: #1890ff; margin-right: 8px;" />
                    </template>
                    <a-list-item-meta title="创建时间" :description="formatDateUTC8(assignment.createdAt)" />
                  </a-list-item>
                </a-list>
                <a-divider style="margin: 16px 0;" />

                <!-- 提交数量统计 -->
                <a-card style="margin-bottom: 16px; text-align: center;">
                  <div style="font-size: 36px; font-weight: bold;">{{ submissions.length }}</div>
                  <div style="font-size: 14px; color: #666;">作文提交数量</div>
                </a-card>
                    <div v-if="!isEditing">
                      <a-button block size="large" type="primary" @click="startEditing">
                        <template #icon><EditOutlined /></template>
                        编辑测验
                      </a-button>
                    </div>
                    <div v-else>
                      <a-button type="text" size="small" @click="cancelEditing">
                        取消
                      </a-button>
                      <a-button type="primary" size="small" :loading="saving" @click="saveEditing">
                        保存
                      </a-button>
                    </div>
              </div>
              <div v-else key="edit-info">
                <a-form layout="vertical">
                  <a-form-item label="年级">
                    <a-input v-model:value="editableGrade" placeholder="年级" />
                  </a-form-item>
                  <a-form-item label="总分">
                    <a-input-number
                      v-model:value="editableTotalScore"
                      :min="0"
                      style="width: 100%"
                      placeholder="总分"
                    />
                  </a-form-item>
                  <a-form-item label="基础分">
                    <a-input-number
                      v-model:value="editableBaseScore"
                      :min="0"
                      style="width: 100%"
                      placeholder="基础分"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </transition>
          </a-col>
        </a-row>
      </a-card>

      <!-- 作文提交列表 -->
      <a-card>
        <template #title>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>作文提交列表</span>
            <!-- 搜索框 -->
            <a-input
              v-model:value="search"
              placeholder="搜索学生"
              allowClear
              style="max-width: 300px;"
            >
              <template #prefix><SearchOutlined /></template>
            </a-input>
          </div>
        </template>

        <!-- 桌面端表格 -->
        <a-table
          v-if="isDesktop"
          :columns="columns"
          :data-source="filteredSubmissions"
          :loading="loadingSubmissions"
          :pagination="false"
          :scroll="{ x: true }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'finalScore' && (record.finalScore !== null || record.score !== null)">
              <span :style="{ color: getScoreColor(record.finalScore) }">{{ record.finalScore }}</span>
            </template>
            <template v-if="column.key === 'finalScore' && record.finalScore === null && record.score === null">
              <span>-</span>
            </template>
            <template v-if="column.key === 'createdAt'">
              {{ formatDateUTC8(record.createdAt) }}
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="link" size="small" @click="openInNewTab(`/essays/${record.id}`)">
                <EyeOutlined />
              </a-button>
            </template>
          </template>
        </a-table>

        <!-- 移动端列表 -->
        <a-list v-else :data-source="filteredSubmissions" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item :style="{ marginBottom: '8px' }">
              <template #actions>
                <a-button type="link" size="small" @click="openInNewTab(`/essays/${item.id}`)">
                  <EyeOutlined />
                </a-button>
              </template>
              <a-list-item-meta>
                <template #title>
                  <a @click="openInNewTab(`/essays/${item.id}`)" style="cursor: pointer;">{{ item.studentName || '未知学生' }}</a>
                </template>
                <template #description>
                  {{ item.className || '未知班级' }} - {{ formatDateUTC8(item.createdAt) }}
                </template>
              </a-list-item-meta>
              <template v-if="item.status === 'Evaluated'" #extra>
                <span :style="{ color: getScoreColor(item.finalScore), fontWeight: 'bold', marginLeft: '8px' }">
                  {{ item.finalScore || '未评分' }}
                </span>
              </template>
              <template v-else #extra>
                <span>-</span>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      
    </div>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftOutlined, EditOutlined, SearchOutlined, EyeOutlined, StarOutlined, StarFilled, CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { getAssignmentById, searchSubmissions, updateAssignment } from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

// Responsive display detection
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

const isDesktop = computed(() => windowWidth.value >= 768)

// 获取路由实例
const route = useRoute()
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
const isEditing = ref(false)
const saving = ref(false)
const search = ref('')
const form = ref<any>(null)

// 编辑相关变量
const editableTitleContext = ref('')
const editableScoringCriteria = ref('')
const editableGrade = ref<string | null>(null)
const editableTotalScore = ref<number | null>(null)
const editableBaseScore = ref<number | null>(null)

// 表格列定义
const columns = [
  { title: '学生', dataIndex: 'studentName', key: 'studentName' ,sorter: (a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || '') },
  { title: '班级', dataIndex: 'className', key: 'className' ,sorter: (a: any, b: any) => (a.className || '').localeCompare(b.className || '') },
  { title: '分数', key: 'finalScore' ,sorter: (a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0) },
  { title: '提交时间', key: 'createdAt' ,sorter:(a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions' }
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

    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      return submission;
    }));

    submissions.value = enrichedSubmissions
  } catch (err) {
    console.error('获取作文提交列表失败:', err)
  } finally {
    loadingSubmissions.value = false
  }
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
  if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.8) {
    return '#52c41a'; // 高分 - 绿色
  } else if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.6) {
    return '#faad14'; // 中等分数 - 橙色
  } else {
    return '#ff4d4f'; // 低分 - 红色
  }
}

// 开始编辑
function startEditing() {
  if (assignment.value) {
    editableTitleContext.value = assignment.value.titleContext || '';
    editableScoringCriteria.value = assignment.value.scoringCriteria || '';
    editableGrade.value = assignment.value.grade || null;
    editableTotalScore.value = assignment.value.totalScore || null;
    editableBaseScore.value = assignment.value.baseScore || null;
    isEditing.value = true;
  }
}

// 取消编辑
function cancelEditing() {
  isEditing.value = false;
  editableTitleContext.value = '';
  editableScoringCriteria.value = '';
  editableGrade.value = null;
  editableTotalScore.value = null;
  editableBaseScore.value = null;
}

// 保存编辑
async function saveEditing() {
  if (!assignment.value) return;

  saving.value = true;
  try {
    const updateData = {
      ...assignment.value,
      titleContext: editableTitleContext.value,
      scoringCriteria: editableScoringCriteria.value,
      grade: editableGrade.value,
      totalScore: editableTotalScore.value,
      baseScore: editableBaseScore.value,
    };

    await updateAssignment(updateData);
    isEditing.value = false;
    await fetchAssignmentDetails();
  } catch (err: any) {
    console.error('保存测验失败:', err);
    alert(err.response?.data?.message || '保存测验失败，请稍后重试');
  } finally {
    saving.value = false;
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignmentDetails()
})

function openInNewTab(path: string) {
  window.open(path, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

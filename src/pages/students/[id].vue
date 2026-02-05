<template>
  <div>
    <a-button class="mb-4" :href="'/students'">
      <template #icon><ArrowLeftOutlined /></template>
      返回学生列表
    </a-button>

    <div v-if="loading" class="flex justify-center items-center" style="height: 400px;">
      <a-spin size="large" />
    </div>

    <div v-else-if="error" class="text-center py-8">
      <ExclamationCircleOutlined class="text-red-500 text-6xl mb-4" />
      <h2 class="text-xl text-red-500">{{ error }}</h2>
      <a-button class="mt-4" type="primary" :href="'/students'">返回学生列表</a-button>
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
              <p class="text-gray-500 mb-4">{{ student.className || '未分配班级' }}</p>

              <a-divider class="mb-4" />

              <a-list :data-source="studentInfoList" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <template #prepend>
                      <component :is="item.icon" class="text-blue-500" />
                    </template>
                    <a-list-item-meta>
                      <template #title>{{ item.label }}</template>
                      <template #description>{{ item.value || '未设置' }}</template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>

              <a-divider class="my-4" />

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
                  <div class="text-4xl font-bold">{{ submissions.length }}</div>
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
              :data-source="submissions"
              :loading="loadingSubmissions"
              :pagination="false"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'assignmentTitle'">
                  <a-tooltip :title="record.assignmentTitle">
                    <span class="truncate inline-block" style="max-width: 200px">
                      {{ record.assignmentTitle }}
                    </span>
                  </a-tooltip>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)">
                    {{ getStatusText(record.status) }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'score'">
                  <template v-if="record.status === 'Evaluated'">
                    <span :class="getScoreColor(record.score)">{{ record.score }}</span>
                  </template>
                  <span v-else>-</span>
                </template>

                <template v-if="column.key === 'submissionDate'">
                  {{ formatDateUTC8(record.submissionDate) }}
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

            <div style="height: 300px;">
              <!-- 这里可以集成图表库，如Chart.js或Echarts -->
              <!-- 简单起见，这里使用占位符 -->
              <div class="flex justify-center items-center h-full text-gray-400">
                图表功能待实现
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

          <a-form-item
            label="联系电话"
            name="phone"
          >
            <a-input v-model:value="editedItem.phone" />
          </a-form-item>

          <a-form-item
            label="电子邮箱"
            name="email"
            :rules="[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]"
          >
            <a-input v-model:value="editedItem.email" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { getStudentById, searchSubmissions, getClasses, updateStudent, getClassById } from '@/services/apiService';
import { formatDateUTC8 } from '@/composables/useDateFormat';

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

// 学生信息列表
const studentInfoList = computed(() => [
  {
    icon: UserOutlined,
    label: '学号',
    value: student.value.studentId
  },
  {
    icon: PhoneOutlined,
    label: '联系电话',
    value: student.value.phone
  },
  {
    icon: MailOutlined,
    label: '电子邮箱',
    value: student.value.email
  }
])

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
  { title: '测验题目', dataIndex: 'assignmentTitle', key: 'assignmentTitle', sorter: (a: any, b: any) => (a.assignmentTitle || '').localeCompare(b.assignmentTitle || '') },
  { title: '状态', key: 'status', sorter: (a: any, b: any) => (a.status || '').localeCompare(b.status || '') },
  { title: '分数', key: 'score', sorter: (a: any, b: any) => (a.score || 0) - (b.score || 0) },
  { title: '提交时间', key: 'submissionDate', sorter: (a: any, b: any) => new Date(a.submissionDate || 0).getTime() - new Date(b.submissionDate || 0).getTime() },
  { title: '操作', key: 'actions' }
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

// 获取学生详情
async function fetchStudentDetails() {
  loading.value = true
  error.value = ''

  try {
    const studentData = await getStudentById(studentId.value);

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
    const submissionData = await searchSubmissions({ studentId: studentId.value });

    // 获取每个提交的测验题目信息 (This part might need backend support or a separate API call if assignment title isn't included)
    // Assuming the backend searchSubmissions now includes assignmentTitle or we fetch it here
    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      // If backend doesn't return assignmentTitle, you might need:
      // const assignmentResponse = await api.get(`/EssayAssignment/${submission.assignmentId}`);
      // const assignment = assignmentResponse.data;
      // return { ...submission, assignmentTitle: assignment?.title || '未知题目' };
      // For now, assuming searchSubmissions includes assignmentTitle
       return submission; // Assuming searchSubmissions returns enriched data
    }));

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
    'Submitted': 'blue',
    'Evaluating': 'orange',
    'Evaluated': 'green'
  }
  return colorMap[status] || 'default'
}

// 获取分数颜色
function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-500'
  if (score >= 80) return 'text-blue-500'
  if (score >= 60) return 'text-orange-500'
  return 'text-red-500'
}

// 页面加载时获取数据
onMounted(() => {
  fetchStudentDetails()
})

function openInNewTab(path: string) {
  window.open(path, '_blank', 'noopener,noreferrer')
}
</script>
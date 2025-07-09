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
              <div class="text-subtitle-1 mb-2">评分标准</div>
              <v-sheet class="pa-4 rounded" color="grey-lighten-4">
                <div class="text-body-1" style="white-space: pre-wrap; line-height: 1.8;">{{ assignment.scoringCriteria || '未设置评分标准' }}</div>
              </v-sheet>
            </v-col>

            <v-col cols="12" md="4">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-account-star</v-icon>
                  </template>
                  <v-list-item-title>年级</v-list-item-title>
                  <v-list-item-subtitle>{{ assignment.grade || '未设置' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-star-circle</v-icon>
                  </template>
                  <v-list-item-title>总分 / 基础分</v-list-item-title>
                  <v-list-item-subtitle>{{ assignment.totalScore || 'N/A' }} / {{ assignment.baseScore || 'N/A' }}</v-list-item-subtitle>
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
      <v-dialog v-model="editDialog" max-width="600px">
        <v-card>
          <v-card-title class="text-h5">编辑测验</v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="saveAssignment">
              <v-select
                v-model="editedItem.grade"
                :items="grades"
                item-title="grade"
                item-value="string"
                label="选择年级"
                required
              ></v-select>
              <v-text-field
                v-model="editedItem.title"
                label="标题"
                :rules="[v => !!v || '标题不能为空']"
                required
              ></v-text-field>
              <v-text-field
                v-model="editedItem.totalScore"
                label="总分"
                type="number"
                :rules="[v => (v !== null && v !== undefined && v > 0) || '总分必须大于0']"
                required
              ></v-text-field>
              <v-text-field
                v-model="editedItem.baseScore"
                label="基础分"
                type="number"
                :rules="[v => (v !== null && v !== undefined && v > 0) || '基础分必须大于0']"
                required
              ></v-text-field>
              <v-textarea
                v-model="editedItem.scoringCriteria"
                label="评分标准"
                :rules="[v => !!v || '评分标准不能为空']"
                required
                rows="5"
              ></v-textarea>
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
import { getAssignmentById, searchSubmissions, updateAssignment } from '@/services/apiService';

const route = useRoute()
const router = useRouter()
// Assert that route.params has an 'id' property of type string
const assignmentId = computed(() => (route.params as { id: string }).id)

// 状态变量
const assignment = ref<any>({
  id: '',
  title: '',
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
  title: '',
  totalScore: null,
  baseScore: null,
  scoringCriteria: '',
})

// Define grades for the select input
const grades = ref([
  { grade: '一年级', string: 'Grade1' },
  { grade: '二年级', string: 'Grade2' },
  { grade: '三年级', string: 'Grade3' },
  { grade: '四年级', string: 'Grade4' },
  { grade: '五年级', string: 'Grade5' },
  { grade: '六年级', string: 'Grade6' },
  { grade: '初一', string: 'Junior1' },
  { grade: '初二', string: 'Junior2' },
  { grade: '初三', string: 'Junior3' },
  { grade: '高一', string: 'Senior1' },
  { grade: '高二', string: 'Senior2' },
  { grade: '高三', string: 'Senior3' },
]);

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
    const data = await getAssignmentById(assignmentId.value);
    assignment.value = data;

    if (!assignment.value) {
      error.value = '未找到测验信息'
      return
    }

    // 初始化编辑项
    editedItem.value = {
      id: assignment.value.id,
      title: assignment.value.title,
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

    // 获取每个提交的学生和班级信息 (This part might need backend support or separate API calls)
    // Assuming searchSubmissions now includes studentName and className
    const enrichedSubmissions = await Promise.all(submissionData.map(async (submission: any) => {
      // If backend doesn't return studentName/className, you might need:
      // const studentResponse = await api.get(`/Student/${submission.studentId}`);
      // const student = studentResponse.data;
      // let className = '';
      // if (student && student.classId) {
      //   const classResponse = await api.get(`/Class/${student.classId}`);
      //   className = classResponse.data?.name || '';
      // }
      // return { ...submission, studentName: student?.name || '未知学生', className: className || '未分配班级' };
      // For now, assuming searchSubmissions includes studentName and className
      return submission; // Assuming searchSubmissions returns enriched data
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
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    await updateAssignment(assignment.value.id, editedItem.value);

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
  // Assuming score is out of assignment.value.totalScore
  if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.8) {
    return 'text-success'; // High score
  } else if (assignment.value.totalScore && score >= assignment.value.totalScore * 0.6) {
    return 'text-warning'; // Medium score
  } else {
    return 'text-error'; // Low score
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignmentDetails()
})
</script>
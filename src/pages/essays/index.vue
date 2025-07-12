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
          <template v-slot:item.submissionDate="{ item }">
            {{ formatDate(item.submissionDate) }}
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
import { searchSubmissions, getAssignments, getStudents, submitSubmissionForEvaluation } from '@/services/apiService';

// Define interface for Essay item
interface Essay {
  id: string | number; // Adjust type based on your API response
  studentName?: string | null | undefined; // Allow studentName to be null or undefined and optional
  assignmentTitle?: string; // Make assignmentTitle optional to match Submission type
  finalScore?: number | null | undefined; // Make finalScore optional to match Submission type
  submissionDate: string; // Adjust type if it's a Date object
  // Add other properties used in the template or headers
}

// Define interface for Assignment item
interface Assignment {
  id: string | number;
  title: string;
  // Add other properties if needed
}

// Helper function to format date
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  // Add 8 hours for UTC+8
  const date = new Date(dateString);
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options); // Use toLocaleString for both date and time
}

// 表头定义
const headers: any[] = [
  { title: '学生姓名', key: 'studentName' },
  { title: '测验题目', key: 'assignmentTitle' },
  { title: '提交时间', key: 'submissionDate' },
  { title: '得分', key: 'finalScore' },
  { title: '操作', key: 'actions', sortable: false },
]

// 数据和状态
const essays = ref<Essay[]>([]) // Type the ref with the Essay interface
const assignments = ref<Assignment[]>([]) // Explicitly type assignments as Assignment[]
interface Student {
  id: string | number;
  name: string;
  // Add other properties if needed
}
const students = ref<Student[]>([])
const loading = ref(false)
const evaluating = ref('')

// 筛选条件
const filters = ref({
  assignmentId: undefined,
  studentId: undefined
})

// 获取所有作文
async function fetchEssays() {
  loading.value = true
  try {
    const data = await searchSubmissions(filters.value);
    essays.value = data || []
  } catch (error) {
    console.error('获取作文列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 根据分数获取颜色
function getScoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return undefined; // Or a default color like 'grey'
  }
  if (score >= 90) {
    return 'green';
  } else if (score >= 75) {
    return 'light-green';
  } else if (score >= 60) {
    return 'orange';
  } else {
    return 'red';
  }
}

// 获取所有测验
async function fetchAssignments() {
  try {
    const data = await getAssignments();
    assignments.value = data as unknown as Assignment[] || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
  }
}

// 获取所有学生
async function fetchStudents() {
  try {
    const data = await getStudents({}); // Pass empty filters
    students.value = data || []
  } catch (error) {
    console.error('获取学生列表失败:', error)
  }
}

// 提交作文评测
async function submitForEvaluation(item: any) {
  evaluating.value = item.id
  try {
    await submitSubmissionForEvaluation(item.id);
    // 刷新作文列表
    await fetchEssays()
  } catch (error) {
    console.error('提交评测失败:', error)
  } finally {
    evaluating.value = ''
  }
}

// Fetch initial data on mount
onMounted(() => {
  fetchEssays();
  fetchAssignments();
  fetchStudents();
});
</script>
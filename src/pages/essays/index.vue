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
              item-value="id"
              clearable
              @update:model-value="fetchEssays"
            >
              <!-- 参照用户提供的示例，修改选择项和列表项的显示 -->
              <template v-slot:selection="{ item }">
                <span>{{ item.raw.description }}</span>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.description">
                  <v-list-item-subtitle>{{ formatDate(item.raw.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.studentName"
              label="搜索学生"
              prepend-icon="mdi-magnify"
              clearable
              placeholder="输入学生姓名搜索"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" @click="fetchEssays" prepend-icon="mdi-refresh">
              刷新
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 学生列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredEssays"
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
import { ref, computed, onMounted } from 'vue'
import { searchSubmissions, getAssignments, submitSubmissionForEvaluation } from '@/services/apiService';

// Define interface for Essay item
interface Essay {
  id: string | number; // Adjust type based on your API response
  studentName?: string | null | undefined; // Allow studentName to be null or undefined and optional
  assignmentTitle?: string; // Make assignmentTitle optional to match Submission type
  finalScore?: number | null | undefined; // Make finalScore optional to match Submission type
  submissionDate: string; // Adjust type if it's a Date object
  status?: string; // Assuming status is returned by searchSubmissions
  // Add other properties used in the template or headers
}

// Define interface for Assignment item
interface Assignment {
  id: string | number;
  title: string;
  createdAt: string; // Ensure createdAt is included for display
  description?: string; // Ensure description is included for display
  // Add other properties if needed
}

// Helper function to format date
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = new Date(dateString);
  // 加8小时，转换为UTC+8
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options); // 使用toLocaleString同时显示日期和时间
}

// 表头定义
const headers = [
  { title: '标题', key: 'title' },
  { title: '学生', key: 'studentName' },
  { title: '分数', key: 'finalScore' },
  { title: '提交时间', key: 'createdAt' }, // Assuming 'createdAt' is the key for submissionDate in the items
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const essays = ref<Essay[]>([]) // Type the ref with the Essay interface
const assignments = ref<Assignment[]>([]) // Explicitly type assignments as Assignment[]
const loading = ref(false)
const evaluating = ref('')

// 筛选条件
const filters = ref({
  assignmentId: undefined,
  studentName: '', // 改为存储搜索关键字
})

// 添加计算属性用于过滤作文列表
const filteredEssays = computed(() => {
  if (!filters.value.studentName) {
    return essays.value;
  }
  const searchTerm = filters.value.studentName.toLowerCase().trim();
  return essays.value.filter(essay => 
    essay.studentName?.toLowerCase().includes(searchTerm)
  );
});

// 获取所有作文
async function fetchEssays() {
  loading.value = true
  try {
    const filterParams = {
      assignmentId: filters.value.assignmentId
    };
    const data = await searchSubmissions(filterParams);
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
    // Ensure the data structure matches the Assignment interface,
    // particularly including 'createdAt' and 'description' if the API provides them.
    // If the API returns 'titleContext' instead of 'description', you might need to map it here.
    // Assuming the API returns 'description' and 'createdAt' as per the template slots.
    assignments.value = data as unknown as Assignment[] || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
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
});
</script>
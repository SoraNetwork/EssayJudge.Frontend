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
                  <v-list-item-subtitle>{{ formatDateUTC8(item.raw.createdAt) }}</v-list-item-subtitle>
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

    <!-- 作文列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredEssays"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDateUTC8(item.createdAt) }}
          </template>
          <template v-slot:item.finalScore="{ item }">
            <v-chip
              :color="getScoreColor(item.finalScore)"
              :text-color="item.finalScore ? 'white' : 'default'"
              size="small"
              variant="flat"
            >
              {{ getDisplayScore(item) }}
            </v-chip>
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
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="deleteEssay(item)"
              :loading="deleting === item.id"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">删除作文</v-tooltip>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" persistent max-width="320">
      <v-card>
        <v-card-title class="text-h5">
          确认删除
        </v-card-title>
        <v-card-text>您确定要删除这篇作文吗？此操作无法撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="closeDeleteDialog">
            取消
          </v-btn>
          <v-btn color="error" text @click="confirmDeleteEssay">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { searchSubmissions, getAssignments, submitSubmissionForEvaluation, deleteSubmission } from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

// Define interface for Essay item
interface Essay {
  id: string | number; // Adjust type based on your API response
  studentName?: string | null | undefined; // Allow studentName to be null or undefined and optional
  title?: string; // Make assignmentTitle optional to match Submission type
  finalScore?: number | null | undefined; // Make finalScore optional to match Submission type
  score?: number | null | undefined; // 添加score字段
  createdAt: string; // Adjust type if it's a Date object
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

// 表头定义
const headers = [
  { title: '标题', key: 'title' },
  { title: '学生', key: 'studentName' },
  { title: '分数', key: 'finalScore' },
  { title: '提交时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const essays = ref<Essay[]>([]) // Type the ref with the Essay interface
const assignments = ref<Assignment[]>([]) // Explicitly type assignments as Assignment[]
const loading = ref(false)
const evaluating = ref<string | number>('')
const deleting = ref<string | number>('')
const deleteDialog = ref(false)
const essayToDelete = ref<Essay | null>(null)

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

// 获取显示分数的逻辑 - 新增函数
function getDisplayScore(item: Essay) {
  // 如果score存在且不为0，则优先显示score
  if (item.score !== null && item.score !== undefined && item.score !== 0) {
    return item.score;
  }
  // 否则显示finalScore或'未评分'
  return item.finalScore ?? '未评分';
}

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

// 根据分数获取颜色 - 优化版本
function getScoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return 'grey-lighten-1';
  }
  if (score >= 50) return 'success';
  if (score >= 42) return 'info';
  if (score >= 38) return 'warning';
  return 'error';
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
async function submitForEvaluation(item: Essay) {
  evaluating.value = item.id
  try {
    await submitSubmissionForEvaluation(String(item.id));
    // 刷新作文列表
    await fetchEssays()
  } catch (error) {
    console.error('提交评测失败:', error)
  } finally {
    evaluating.value = ''
  }
}

// 打开删除确认对话框
function deleteEssay(item: Essay) {
  essayToDelete.value = item;
  deleteDialog.value = true;
}

// 关闭删除确认对话框
function closeDeleteDialog() {
  deleteDialog.value = false;
  essayToDelete.value = null;
}

// 确认删除作文
async function confirmDeleteEssay() {
  if (!essayToDelete.value) return;

  deleting.value = essayToDelete.value.id;
  try {
    await deleteSubmission(String(essayToDelete.value.id));
    // 刷新作文列表
    await fetchEssays();
  } catch (error) {
    console.error('删除作文失败:', error);
  } finally {
    deleting.value = '';
    closeDeleteDialog();
  }
}

// Fetch initial data on mount
onMounted(() => {
  fetchEssays();
  fetchAssignments();
});
</script>
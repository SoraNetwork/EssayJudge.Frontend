<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h1 style="font-size: 24px; font-weight: 500; margin: 0;">作文管理</h1>
      <div>
        <a-button type="default" href="/essay/upload" style="margin-right: 8px;">
          <template #icon><UploadOutlined /></template>
          作文上传（学生版）
        </a-button>
        <a-button type="primary" href="/essays/upload">
          <template #icon><UploadOutlined /></template>
          上传批改
        </a-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <a-card style="margin-bottom: 16px;">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-select
            v-model:value="filters.assignmentId"
            placeholder="测验题目"
            style="width: 100%"
            :options="assignmentOptions"
            allowClear
            @change="fetchEssays"
          />
        </a-col>
        <a-col :span="8">
          <a-input
            v-model:value="filters.studentName"
            placeholder="输入学生姓名搜索"
            allowClear
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="8">
          <a-button type="primary" @click="fetchEssays">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 作文列表 -->
    <a-card>
      <!-- 桌面端表格 -->
      <a-table
        v-if="isDesktop"
        :columns="columns"
        :data-source="filteredEssays"
        :loading="loading"
        :scroll="{ x: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDateUTC8(record.createdAt) }}
          </template>
          <template v-if="column.key === 'finalScore'">
            <a-tag :color="getScoreColor(record.finalScore)">
              {{ getDisplayScore(record) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'actions'">
            <a-tooltip title="查看详情">
              <a-button type="text" size="small" :href="`/essays/${record.id}`">
                <EyeOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="重新评测">
              <a-button
                type="text"
                size="small"
                :disabled="!record.isPrased"
                :loading="evaluating === record.id"
                @click="submitForEvaluation(record)"
              >
                <ReloadOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除作文">
              <a-button
                type="text"
                size="small"
                danger
                :loading="deleting === record.id"
                @click="deleteEssay(record)"
              >
                <DeleteOutlined />
              </a-button>
            </a-tooltip>
          </template>
        </template>
      </a-table>

      <!-- 移动端列表 -->
      <a-list v-else :data-source="filteredEssays" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-tag :color="getScoreColor(item.finalScore)">
                {{ getDisplayScore(item) }}
              </a-tag>
            </template>
            <a-list-item-meta>
              <template #title>
                <a :href="`/essays/${item.id}`">{{ item.title }}</a>
              </template>
              <template #description>
                {{ item.studentName }} - {{ formatDateUTC8(item.createdAt) }}
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteDialog"
      title="确认删除"
      :closable="false"
      :maskClosable="false"
      width="320px"
    >
      <p>您确定要删除这篇作文吗？此操作无法撤销。</p>
      <template #footer>
        <a-button @click="closeDeleteDialog">取消</a-button>
        <a-button type="primary" danger @click="confirmDeleteEssay">删除</a-button>
      </template>
    </a-modal>

    <!-- 重新评测确认对话框 -->
    <a-modal
      v-model:open="reEvaluateDialog"
      title="确认重新评测"
      :closable="false"
      :maskClosable="false"
      width="320px"
    >
      <p>您确定要重新评测这篇作文吗？这将覆盖之前的评测结果。</p>
      <template #footer>
        <a-button @click="closeReEvaluateDialog">取消</a-button>
        <a-button type="primary" @click="confirmReEvaluate">确认</a-button>
      </template>
    </a-modal>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UploadOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { searchSubmissions, getAssignments, submitSubmissionForEvaluation, deleteSubmission } from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

// Define interface for Essay item
interface Essay {
  id: string | number;
  studentName?: string | null | undefined;
  title?: string;
  finalScore?: number | null | undefined;
  score?: number | null | undefined;
  createdAt: string;
  status?: string;
  isPrased?: boolean;
}

// Define interface for Assignment item
interface Assignment {
  id: string | number;
  title: string;
  createdAt: string;
  description?: string;
}

// 表格列定义
const columns = [
  { title: '标题', dataIndex: 'title', key: 'title', sorted: (a: any, b: any) => (a.title || '').localeCompare(b.title || '') },
  { title: '学生', dataIndex: 'studentName', key: 'studentName', sorted: (a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || '') },
  { title: '分数', key: 'finalScore' ,sorted: (a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0) },
  { title: '提交时间', key: 'createdAt' ,sorted:(a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions' }
]

// 数据和状态
const essays = ref<Essay[]>([])
const assignments = ref<Assignment[]>([])
const loading = ref(false)
const evaluating = ref<string | number>('')
const deleting = ref<string | number>('')
const deleteDialog = ref(false)
const essayToDelete = ref<Essay | null>(null)
const reEvaluateDialog = ref(false)
const essayToReEvaluate = ref<Essay | null>(null)

// 筛选条件
const filters = ref({
  assignmentId: undefined,
  studentName: '',
})

// 响应式检测
const isDesktop = ref(window.innerWidth >= 768)

// Assignment options for select
const assignmentOptions = computed(() => {
  return assignments.value.map(item => ({
    value: item.id,
    label: item.description || item.title,
    description: item.description,
    createdAt: item.createdAt
  }))
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

// 获取显示分数的逻辑
function getDisplayScore(item: Essay) {
  if (item.score !== null && item.score !== undefined && item.score !== 0) {
    return item.score;
  }
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

// 根据分数获取颜色
function getScoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return 'default';
  }
  if (score >= 54) return 'gold';
  if (score >= 48) return 'green';
  if (score >= 42) return 'cyan';
  if (score >= 36) return 'orange';
  if (score >= 30) return 'red';
  return 'red';
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

// 修改提交评测方法
async function submitForEvaluation(item: Essay) {
  essayToReEvaluate.value = item;
  reEvaluateDialog.value = true;
}

// 关闭重新评测确认对话框
function closeReEvaluateDialog() {
  reEvaluateDialog.value = false;
  essayToReEvaluate.value = null;
}

// 确认重新评测
async function confirmReEvaluate() {
  if (!essayToReEvaluate.value) return;

  evaluating.value = essayToReEvaluate.value.id;
  reEvaluateDialog.value = false;
  
  try {
    await submitSubmissionForEvaluation(String(essayToReEvaluate.value.id));
    await fetchEssays();
  } catch (error) {
    console.error('重新评测失败:', error);
  } finally {
    evaluating.value = '';
    essayToReEvaluate.value = null;
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
    await fetchEssays();
  } catch (error) {
    console.error('删除作文失败:', error);
  } finally {
    deleting.value = '';
    closeDeleteDialog();
  }
}

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isDesktop.value = window.innerWidth >= 768
  })
}

// Fetch initial data on mount
onMounted(() => {
  fetchEssays();
  fetchAssignments();
});
</script>
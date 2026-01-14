<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h1 style="font-size: 24px; font-weight: 500; margin: 0;">测验管理</h1>
      <a-button type="primary" @click="dialog = true">
        <template #icon><PlusOutlined /></template>
        新建测验
      </a-button>
    </div>

    <!-- 搜索框 -->
    <a-input
      v-model:value="searchTerm"
      placeholder="搜索作文题目"
      allowClear
      style="margin-bottom: 16px;"
      @input="handleSearch"
    >
      <template #prefix><SearchOutlined /></template>
    </a-input>

    <!-- 测验列表 -->
    <a-card>
      <!-- 桌面端表格 -->
      <a-table
        v-if="isDesktop"
        :columns="columns"
        :data-source="filteredAssignments"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDateUTC8(record.createdAt) }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-tooltip title="查看详情">
              <a-button type="text" size="small" :href="`/assignments/${record.id}`">
                <EyeOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="编辑">
              <a-button type="text" size="small" @click="editAssignment(record)">
                <EditOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除">
              <a-button type="text" size="small" danger @click="confirmDelete(record)">
                <DeleteOutlined />
              </a-button>
            </a-tooltip>
          </template>
        </template>
      </a-table>

      <!-- 移动端列表 -->
      <a-list v-else :data-source="filteredAssignments" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-button type="text" size="small" @click="editAssignment(item)">
                <EditOutlined />
              </a-button>
              <a-button type="text" size="small" danger @click="confirmDelete(item)">
                <DeleteOutlined />
              </a-button>
            </template>
            <a-list-item-meta>
              <template #title>
                <a :href="`/assignments/${item.id}`">{{ item.description }}</a>
              </template>
              <template #description>
                {{ item.grade }} - {{ formatDateUTC8(item.createdAt) }}
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <!-- 新建/编辑测验对话框 -->
    <EditAssignments
      v-model="dialog"
      :edited-item="editedItem"
      :is-editing="isEditing"
      :saving="saving"
      @update:editedItem="editedItem = $event"
      @save="saveAssignment"
    />

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteDialog"
      title="确认删除"
      :closable="false"
      :maskClosable="false"
      width="400px"
    >
      <p>确定要删除这个测验吗？此操作不可撤销。</p>
      <template #footer>
        <a-button @click="deleteDialog = false">取消</a-button>
        <a-button type="primary" danger @click="deleteAssignment" :loading="deleting">删除</a-button>
      </template>
    </a-modal>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment as deleteAssignmentApi, type Assignment } from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';
import EditAssignments from '@/components/EditAssignments.vue';

// 数据和状态
const loading = ref(false)
const dialog = ref(false)
const searchTerm = ref('')
watch(dialog, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    window.location.reload();
  }
});

// 表格列定义
const columns = [
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions' }
]

// 数据和状态
const assignments = ref<Assignment[]>([])
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 响应式检测
const isDesktop = ref(window.innerWidth >= 768)

// 编辑项的接口定义
interface EditedAssignment {
  id: string;
  grade: string | null;
  totalScore: number | null;
  baseScore: number | null;
  scoringCriteria: string;
  description: string | null;
  titleContext: string | null;
  createdAt?: string | null;
}

// 当前编辑的项目
const editedItem = ref<EditedAssignment>({
  id: '',
  grade: null,
  totalScore: null,
  baseScore: null,
  scoringCriteria: '',
  description:'',
  titleContext: '',
})

// 待删除的项
const itemToDelete = ref<any>(null)

// 根据搜索词过滤作业列表
const filteredAssignments = computed(() => {
  if (!searchTerm.value) {
    return assignments.value;
  }

  const term = searchTerm.value.toLowerCase();
  return assignments.value.filter(assignment =>
    assignment.description && assignment.description.toLowerCase().includes(term)
  );
});

// 处理搜索输入
const handleSearch = () => {
};

// 确认删除测验
const confirmDelete = (item: any) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 编辑测验
const editAssignment = (item: Assignment) => {
  isEditing.value = true;
  editedItem.value = {
    id: item.id,
    grade: item.grade || null,
    totalScore: item.totalScore || null,
    baseScore: item.baseScore || null,
    scoringCriteria: item.scoringCriteria || '',
    description: item.description || null,
    titleContext: item.titleContext || null,
    createdAt: item.createdAt || null,
  }
  dialog.value = true;
}

// 获取所有测验
const fetchAssignments = async () => {
  loading.value = true
  try {
    const data = await getAssignments();
    assignments.value = data || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存测验
const saveAssignment = async (item: EditedAssignment) => {
  saving.value = true
  try {
    if (isEditing.value) {
      await updateAssignment(item as unknown as Assignment);
    } else {
      const dataToSend: Omit<Assignment, "createdAt" | "id" | "updatedAt"> = {
        scoringCriteria: item.scoringCriteria,
        grade: item.grade || undefined,
        totalScore: item.totalScore || undefined,
        baseScore: item.baseScore || undefined,
        titleContext: item.titleContext || undefined,
        description: item.description || undefined,
      };
      await createAssignment(dataToSend);
    }

    dialog.value = false
  } catch (error) {
    console.error('保存测验失败:', error)
  } finally {
    saving.value = false
  }
}

// 删除测验
const deleteAssignment = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    await deleteAssignmentApi(itemToDelete.value.id);
    deleteDialog.value = false
    await fetchAssignments();
  } catch (error) {
    console.error('删除测验失败:', error)
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

// 重置表单
const resetForm = () => {
  isEditing.value = false
  editedItem.value = {
    id: '',
    grade: null,
    totalScore: null,
    baseScore: null,
    scoringCriteria: '',
    description: '',
    titleContext: '',
  }
}

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isDesktop.value = window.innerWidth >= 768
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignments()
})
</script>

export interface Assignment {
  id: string;
  description?: string;
  prompt?: string;
  wordLimit?: number;
  grade?: string;
  totalScore?: number;
  baseScore?: number;
  scoringCriteria?: string;
  createdAt?: string;
  updatedAt?: string;
}
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
    <a-card style="margin-bottom: 16px;">
      <div style="display: flex; gap: 12px">
        <a-input
          v-model:value="searchTerm"
          placeholder="搜索作文题目"
          allowClear
          style="min-width: 180px;max-width: 300px;"
          @input="handleSearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>

        <a-range-picker
          v-model:value="dateRange"
          style="min-width: 200px;"
          allowClear
          @change="handleDateChange"
          :locale="rangePickerLocale"
        />
      </div>
    </a-card>
    <!-- 测验列表 -->
    <a-card>
      <!-- 桌面端表格 -->
      <a-table
        v-if="isDesktop"
        :columns="columns"
        :data-source="filteredAssignments"
        :loading="loading"
        rowKey="id"
        :scroll="{ x: true }"
        :pagination="{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: any) => `共 ${total} 条`
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDateUTC8(record.createdAt) }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-tooltip title="查看详情">
              <a-button type="text" size="small" @click="openInNewTab(`/assignments/${record.id}`)">
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
                <a @click="openInNewTab(`/assignments/${item.id}`)" style="cursor: pointer;">{{ item.description }}</a>
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
import { formatDateUTC8 } from '@/composables/useDateFormat';
import EditAssignments from '@/components/EditAssignments.vue';
import zhCN from 'ant-design-vue/es/date-picker/locale/zh_CN'; // 导入中文本地化

// 数据和状态
const loading = ref(false)
const dialog = ref(false)
const searchTerm = ref('')
// 添加日期选择器本地化配置
const rangePickerLocale = ref({
  ...zhCN,
  lang: {
    ...zhCN.lang,
    placeholder: '请选择日期',
    rangePlaceholder: ['开始日期', '结束日期'],
  }
})
watch(dialog, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    window.location.reload();
  }
});

// 表格列定义
const columns = [
  { title: '描述', dataIndex: 'description', key: 'description', sorter: (a: any, b: any) => (a.description || '').localeCompare(b.description || '') },
  { title: '年级', dataIndex: 'grade', key: 'grade',sorter: (a: any, b: any) => (a.grade || '').localeCompare(b.grade || '') },
  { title: '创建时间', key: 'createdAt',sorter:(a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
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

const dateRange = ref<any[]>([])

// 根据搜索词和创建时间范围过滤作业列表
const filteredAssignments = computed(() => {
  let list = assignments.value;

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    list = list.filter(assignment =>
      assignment.description && assignment.description.toLowerCase().includes(term)
    );
  }

  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const [startRaw, endRaw] = dateRange.value;
    const startTime = startRaw.toDate ? startRaw.toDate().setHours(0,0,0,0) : new Date(startRaw).setHours(0,0,0,0);
    const endTime = endRaw.toDate ? endRaw.toDate().setHours(23,59,59,999) : new Date(endRaw).setHours(23,59,59,999);

    list = list.filter(a => {
      if (!a.createdAt) return false;
      const t = new Date(a.createdAt).getTime();
      return t >= startTime && t <= endTime;
    });
  }

  return list;
});

// 处理搜索输入
const handleSearch = () => {
};

// 处理日期选择变化
const handleDateChange = (dates: any) => {
  dateRange.value = dates || []
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

function openInNewTab(path: string) {
  window.open(path, '_blank', 'noopener,noreferrer')
}
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
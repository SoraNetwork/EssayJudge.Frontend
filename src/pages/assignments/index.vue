<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">测验管理</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">新建测验</v-btn>
    </div>

    <!-- 搜索框 -->
    <v-text-field
      v-model="searchTerm"
      label="搜索作文题目"
      prepend-inner-icon="mdi-magnify"
      clearable
      class="mb-4"
      @input="handleSearch"
    ></v-text-field>

    <!-- 测验列表 -->
    <v-card>
      <v-card-text class="responsive-table-container">
        <!-- 桌面端表格 -->
        <v-data-table
          v-if="display.mdAndUp.value"
          :headers="headers"
          :items="filteredAssignments"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDateUTC8(item.createdAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :to="`/assignments/${item.id}`"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editAssignment(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <!-- 移动端列表 -->
        <v-list v-else>
          <v-list-item
            v-for="item in filteredAssignments"
            :key="item.id"
            :to="`/assignments/${item.id}`"
            class="mb-2"
          >
            <v-list-item-content>
              <v-list-item-title>{{ item.description }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ item.grade }} - {{ formatDateUTC8(item.createdAt) }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <template v-slot:append>
              <v-btn
                icon
                variant="text"
                size="small"
                @click.prevent="editAssignment(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                @click.prevent="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- 新建/编辑测验对话框 -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑测验' : '新建测验' }}</span>
        </v-card-title>
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
              v-model="editedItem.titleContext"
              label="标题"
              rows="5"
            ></v-textarea>
            <v-textarea
              v-model="editedItem.description"
              label="描述"
              rows="5"
            ></v-textarea>
            <v-textarea
              v-model="editedItem.scoringCriteria"
              label="评分标准"
              rows="5"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveAssignment" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>确定要删除这个测验吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteAssignment" :loading="deleting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDisplay } from 'vuetify'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment as deleteAssignmentApi, type Assignment } from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

const display = useDisplay()

// 数据和状态
const loading = ref(false)
const dialog = ref(false)
const searchTerm = ref('')
watch(dialog, (newValue, oldValue) => {
  // 当对话框从打开状态变为关闭状态时
  if (oldValue === true && newValue === false) {
    // 刷新页面
    window.location.reload();
  }
});

// 表格列定义
const headers = [
  { title: '描述', key: 'description' }, 
  { title: '年级', key: 'grade' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const assignments = ref<Assignment[]>([])
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 年级下拉选项
const grades = ref([
  { grade: '一年级', string: '一年级' },
  { grade: '二年级', string: '二年级' },
  { grade: '三年级', string: '三年级' },
  { grade: '四年级', string: '四年级' },
  { grade: '五年级', string: '五年级' },
  { grade: '六年级', string: '六年级' },
  { grade: '初一', string: '初一' },
  { grade: '初二', string: '初二' },
  { grade: '初三', string: '初三' },
  { grade: '高一', string: '高一' },
  { grade: '高二', string: '高二' },
  { grade: '高三', string: '高三' },
]);

// 编辑项的接口定义
interface EditedAssignment {
  id: string;
  grade: string | null;
  totalScore: number | null;
  baseScore: number | null;
  scoringCriteria: string;
  description: string | null; 
  titleContext: string | null; // 标题内容
  createdAt?: string | null; // 原始创建时间
}

// 当前编辑的项目 - 与表单字段保持一致
const editedItem = ref<EditedAssignment>({
  id: '',
  grade: null, // 用于v-select
  totalScore: null, // 总分
  baseScore: null, // 基础分
  description:'', 
  scoringCriteria: '', // 评分标准
  titleContext: '', // 标题内容
  // description和prompt不在新的editedItem结构中
}) // <-- 在此处关闭ref对象

// 待删除的项
const itemToDelete = ref<any>(null) // <-- 新增itemToDelete的ref

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
  // 搜索逻辑在computed中处理，这里可以添加防抖等逻辑
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
    createdAt: item.createdAt || null, // 保存原始创建时间
  }
  dialog.value = true;
}

// 获取所有测验
const fetchAssignments = async () => {
  loading.value = true
  try {
    // 用getAssignments替换api.get
    const data = await getAssignments();
    assignments.value = data || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存测验
const saveAssignment = async () => {
  // 表单校验
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEditing.value) {
      // 编辑测验，发送包含所有必需字段的完整对象
      await updateAssignment(editedItem.value as unknown as Assignment);
    } else {
      // 新建测验
      const dataToSend: Omit<Assignment, "createdAt" | "id" | "updatedAt"> = {
        scoringCriteria: editedItem.value.scoringCriteria,
        // 将表单模型中的null转换为undefined，适配API可选字段
        grade: editedItem.value.grade || undefined,
        totalScore: editedItem.value.totalScore || undefined,
        baseScore: editedItem.value.baseScore || undefined,
        titleContext: editedItem.value.titleContext || undefined,
        description: editedItem.value.description || undefined, 
      };
      await createAssignment(dataToSend);
    }

    // 关闭对话框，watcher会处理刷新和重置
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
    // 用deleteAssignment替换api.delete
    await deleteAssignmentApi(itemToDelete.value.id);
    deleteDialog.value = false
    await fetchAssignments(); // 刷新列表
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
    grade: null, // 年级
    totalScore: null, // 总分
    baseScore: null, // 基础分
    scoringCriteria: '', // 评分标准
    description: '', // 描述
    titleContext: '', // 标题内容
    // description和prompt不在表单/editedItem ref中
  }
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
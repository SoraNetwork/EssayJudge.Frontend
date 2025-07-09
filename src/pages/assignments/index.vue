<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">测验管理</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">新建测验</v-btn>
    </div>

    <!-- 测验列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="assignments"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ new Date(item.createdAt).toLocaleString() }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :to="`/EssayAssignment/${item.id}`"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment as deleteAssignmentApi, type Assignment } from '@/services/apiService';

// 数据和状态
const loading = ref(false)
const dialog = ref(false)
// 表格列定义
const headers = [
  { title: '标题', key: 'title' },
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

// Define interface for edited item
interface EditedAssignment {
  id: string;
  grade: string | null;
  title: string;
  totalScore: number | null;
  baseScore: number | null;
  scoringCriteria: string;
}

// 当前编辑的项目 - Updated to match form fields
const editedItem = ref<EditedAssignment>({ // Add type argument
  id: '',
  grade: null, // For v-select
  title: '', // For titleContext
  totalScore: null, // For totalScore
  baseScore: null, // For baseScore
  scoringCriteria: '', // For scoringCriteria
  // description and prompt are not in the new editedItem structure
}) // <-- Close the ref object here

// Item to delete
const itemToDelete = ref<any>(null) // <-- Add itemToDelete ref

// 确认删除测验
const confirmDelete = (item: any) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 编辑测验
const editAssignment = (item: Assignment) => { // Use imported type
  isEditing.value = true
  // Copy properties from item, including new ones if they exist on the fetched item
  // Ensure all properties expected by the form are copied
  editedItem.value = {
    id: item.id,
    grade: item.grade || null,
    title: item.title || '',
    totalScore: item.totalScore || null,
    baseScore: item.baseScore || null,
    scoringCriteria: item.scoringCriteria || '',
    // description and prompt are not in the new editedItem structure
  }
  dialog.value = true
}

// 获取所有测验
const fetchAssignments = async () => {
  loading.value = true
  try {
    // Replace api.get with getAssignments
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
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    // Prepare data for the API
    const dataToSend: Omit<Assignment, "createdAt" | "id" | "updatedAt"> = {
      title: editedItem.value.title,
      scoringCriteria: editedItem.value.scoringCriteria,
      // Convert nulls from form model to undefined for optional API fields
      grade: editedItem.value.grade || undefined,
      totalScore: editedItem.value.totalScore || undefined,
      baseScore: editedItem.value.baseScore || undefined,
    };

    if (isEditing.value) {
      // Replace api.put with updateAssignment
      await updateAssignment(editedItem.value.id, dataToSend); // Use dataToSend
    } else {
      // Replace api.post with createAssignment
      await createAssignment(dataToSend); // Use dataToSend
    }

    // 关闭对话框并刷新列表
    dialog.value = false
    await fetchAssignments()

    // 重置表单
    resetForm()
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
    // Replace api.delete with deleteAssignment
    await deleteAssignmentApi(itemToDelete.value.id);
    deleteDialog.value = false
    await fetchAssignments()
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
    grade: null, // Add grade
    title: '',
    totalScore: null, // Add totalScore
    baseScore: null, // Add baseScore
    scoringCriteria: '', // Add scoringCriteria
    // Remove description and prompt as they are not in the form/editedItem ref
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignments()
})
</script>

export interface Assignment {
  id: string;
  title: string;
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
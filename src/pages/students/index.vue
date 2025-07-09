<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">学生管理</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">添加学生</v-btn>
    </div>

    <!-- 筛选条件 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.classId"
              label="班级"
              :items="classes"
              item-title="name"
              item-value="id"
              clearable
              @update:model-value="fetchStudents"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.searchTerm"
              label="搜索学生"
              prepend-icon="mdi-magnify"
              clearable
              @keyup.enter="fetchStudents"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" @click="fetchStudents" prepend-icon="mdi-refresh">
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
          :items="students"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editStudent(item)"
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

    <!-- 新建/编辑学生对话框 -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑学生' : '添加学生' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveStudent">
            <v-text-field
              v-model="editedItem.name"
              label="姓名"
              :rules="[v => !!v || '姓名不能为空']"
              required
            ></v-text-field>
            <v-text-field
              v-model="editedItem.studentId"
              label="学号"
              :rules="[v => !!v || '学号不能为空']"
              required
            ></v-text-field>
            <v-select
              v-model="editedItem.classId"
              label="班级"
              :items="classes"
              item-title="name"
              item-value="id"
              :rules="[v => !!v || '请选择班级']"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveStudent" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>确定要删除学生 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteStudent" :loading="deleting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// Import Student type from apiService
import { getStudents, getClasses, createStudent, updateStudent, deleteStudent as apiDeleteStudent, type Student } from '@/services/apiService';

interface Class {
  id: string;
  name: string;
}

// Define a type for the form data, based on the imported Student type
// It allows classId to be null for the select component
// Explicitly define properties needed for the form
interface EditedStudent {
  id: string;
  name: string;
  studentId: string;
  classId: string | null;
  // Add other properties from Student if needed in the form, e.g., className
  // className?: string;
}

// 表格列定义
const headers = [
  { title: '姓名', key: 'name' },
  { title: '学号', key: 'studentId' },
  { title: '班级', key: 'className' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const students = ref<Student[]>([])
const classes = ref<Class[]>([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 筛选条件
const filters = ref({
  classId: null as string | null,
  searchTerm: '',
});

// 当前编辑的项目
// 当前编辑的项目
const editedItem = ref<EditedStudent>({ // Use the EditedStudent type
  id: '',
  name: '',
  studentId: '',
  classId: null, // Allow null for initial state and no selection
})
// 要删除的项目
const itemToDelete = ref<Student | null>(null)

// 获取所有学生
async function fetchStudents() {
  loading.value = true
  try {
    // Construct filters object, excluding null values
    const effectiveFilters: { classId?: string; searchTerm?: string } = {};
    if (filters.value.classId !== null && filters.value.classId !== undefined) {
      effectiveFilters.classId = filters.value.classId;
    }
    if (filters.value.searchTerm) {
      effectiveFilters.searchTerm = filters.value.searchTerm;
    }

    const data = await getStudents(effectiveFilters);
    students.value = data || [];
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 重置编辑项
function resetEditedItem() {
  editedItem.value = {
    id: '',
    name: '',
    studentId: '',
    classId: null,
  };
}

// 编辑学生
function editStudent(item: Student) {
  isEditing.value = true;
  // Ensure all properties are copied, including id
  editedItem.value = { ...item, classId: item.classId || null }; // Handle potential null classId
  dialog.value = true;
}

// 确认删除学生
function confirmDelete(item: Student) {
  itemToDelete.value = item;
  deleteDialog.value = true;
}

// 保存学生 (新建或编辑)
async function saveStudent() {
  if (!form.value) return;
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      // Ensure id is passed for update
      if (!editedItem.value.id) {
         console.error("Cannot update student without an ID.");
         return; // Or handle this error appropriately
      }
      // Prepare data for update, excluding className if it exists
      const { className, ...dataToUpdate } = editedItem.value;
      await updateStudent(editedItem.value.id, dataToUpdate);
    } else {
      // Prepare data for create, excluding id and className
      const { id, className, ...dataToCreate } = editedItem.value;
      await createStudent(dataToCreate);
    }
    dialog.value = false;
    resetEditedItem();
    fetchStudents(); // Refresh list
  } catch (error) {
    console.error('保存学生失败:', error);
    // Optionally show a user-friendly error message
  } finally {
    saving.value = false;
  }
}

// 删除学生
async function deleteStudent() {
  if (!itemToDelete.value) return;

  deleting.value = true;
  try {
    await apiDeleteStudent(itemToDelete.value.id);
    deleteDialog.value = false;
    itemToDelete.value = null;
    fetchStudents(); // Refresh list
  } catch (error) {
    console.error('删除学生失败:', error);
    // Optionally show a user-friendly error message
  } finally {
    deleting.value = false;
  }
}

// 初始化数据
onMounted(() => {
  fetchClasses();
  fetchStudents();
});

// 获取所有班级
async function fetchClasses() {
  try {
    const data = await getClasses();
    classes.value = data || [];
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}


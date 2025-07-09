<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">班级管理</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">添加班级</v-btn>
    </div>

    <!-- 班级列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="classes"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.studentCount="{ item }">
            <v-chip color="primary" variant="outlined">
              {{ item.studentCount || 0 }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editClass(item)"
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

    <!-- 新建/编辑班级对话框 -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑班级' : '添加班级' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveClass">
            <v-text-field
              v-model="editedItem.name"
              label="班级名称"
              :rules="[v => !!v || '班级名称不能为空']"
              required
              @keyup.enter.prevent="saveClass"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveClass" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>
          确定要删除班级 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。
          <div class="mt-2" v-if="itemToDelete && itemToDelete.studentCount > 0">
            <v-alert type="warning" variant="tonal" density="compact">
              注意：该班级下有 {{ itemToDelete?.studentCount }} 名学生，删除班级将导致这些学生失去班级关联。
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteClass" :loading="deleting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getClasses, createClass, updateClass, deleteClass as apiDeleteClass, getStudents } from '@/services/apiService';

// Define the type for a class item
interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
}

// 表格列定义
const headers = [
  { title: '班级名称', key: 'name' },
  { title: '学生数量', key: 'studentCount' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const classes = ref<ClassItem[]>([]) // Type the classes ref
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 当前编辑的项目
const editedItem = ref<Partial<ClassItem>>({ // Type the editedItem ref
  id: '',
  name: '',
})

// 要删除的项目
const itemToDelete = ref<ClassItem | null>(null) // Type the itemToDelete ref

// 获取所有班级
async function fetchClasses() {
  loading.value = true
  try {
    const data = await getClasses(); // Assuming getClasses returns an array of objects with id and name
    const classesWithCount: ClassItem[] = []; // Array to hold typed class items

    for (const classItem of data || []) {
      try {
        const studentsResponse = await getStudents({ classId: classItem.id });
        classesWithCount.push({
          id: classItem.id, // Assuming id exists
          name: classItem.name, // Assuming name exists
          studentCount: studentsResponse.length || 0
        });
      } catch (error) {
        console.error(`获取班级 ${classItem.name} 的学生数量失败:`, error)
        classesWithCount.push({
          id: classItem.id,
          name: classItem.name,
          studentCount: 0 // Default to 0 on error
        });
      }
    }
    classes.value = classesWithCount; // Assign the typed array
  } catch (error) {
    console.error('获取班级列表失败:', error)
    classes.value = []; // Assign empty array on error
  } finally {
    loading.value = false
  }
}

// 编辑班级
function editClass(item: ClassItem) { // Type the item parameter
  isEditing.value = true
  editedItem.value = { ...item }
  dialog.value = true
}

// 保存班级
async function saveClass() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const dataToSave = { name: editedItem.value.name! }; // Always send only name

    if (isEditing.value) {
      if (!editedItem.value.id) {
        console.error('Cannot update class without an ID');
        return; // Or handle error appropriately
      }
      await updateClass(editedItem.value.id, dataToSave);
    } else {
      await createClass(dataToSave);
    }

    // 关闭对话框并刷新列表
    dialog.value = false
    await fetchClasses()

    // 重置表单
    resetForm()
  } catch (error) {
    console.error('保存班级失败:', error)
  } finally {
    saving.value = false
  }
}

// 确认删除
function confirmDelete(item: ClassItem) { // Type the item parameter
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除班级
async function deleteClass() {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    await apiDeleteClass(itemToDelete.value.id);
    deleteDialog.value = false
    await fetchClasses()
  } catch (error) {
    console.error('删除班级失败:', error)
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

// 重置表单
function resetForm() {
  isEditing.value = false
  editedItem.value = {
    id: '',
    name: '',
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchClasses()
})
</script>
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
            <v-text-field
              v-model="editedItem.email"
              label="邮箱"
              type="email"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.phoneNumber"
              label="手机号"
              type="tel"
              :rules="[v => !v || /^1\d{10}$/.test(v) || '请输入有效的手机号']"
            ></v-text-field>
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
import api from '@/services/api'

// 表格列定义
const headers = [
  { title: '姓名', key: 'name' },
  { title: '学号', key: 'studentId' },
  { title: '班级', key: 'className' },
  { title: '邮箱', key: 'email' },
  { title: '手机号', key: 'phoneNumber' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const students = ref([])
const classes = ref([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 筛选条件
const filters = ref({
  classId: '',
  searchTerm: ''
})

// 当前编辑的项目
const editedItem = ref({
  id: '',
  name: '',
  studentId: '',
  classId: '',
  email: '',
  phoneNumber: ''
})

// 要删除的项目
const itemToDelete = ref<any>(null)

// 获取所有学生
async function fetchStudents() {
  loading.value = true
  try {
    let url = '/Student'
    const params = new URLSearchParams()
    
    if (filters.value.classId) {
      params.append('classId', filters.value.classId)
    }
    
    if (filters.value.searchTerm) {
      params.append('searchTerm', filters.value.searchTerm)
    }
    
    // 添加参数
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const response = await api.get(url)
    students.value = response.data || []
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取所有班级
async function fetchClasses() {
  try {
    const response = await api.get('/Class')
    classes.value = response.data || []
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 编辑学生
function editStudent(item: any) {
  isEditing.value = true
  editedItem.value = { ...item }
  dialog.value = true
}

// 保存学生
async function saveStudent() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEditing.value) {
      // 更新现有学生
      await api.put(`/Student/${editedItem.value.id}`, editedItem.value)
    } else {
      // 创建新学生
      await api.post('/Student', editedItem.value)
    }
    
    // 关闭对话框并刷新列表
    dialog.value = false
    await fetchStudents()
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('保存学生失败:', error)
  } finally {
    saving.value = false
  }
}

// 确认删除
function confirmDelete(item: any) {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除学生
async function deleteStudent() {
  if (!itemToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/Student/${itemToDelete.value.id}`)
    deleteDialog.value = false
    await fetchStudents()
  } catch (error) {
    console.error('删除学生失败:', error)
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
    studentNumber: '',
    classId: '',
    email: '',
    phoneNumber: ''
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchStudents()
  fetchClasses()
})
</script>
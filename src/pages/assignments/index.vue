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
            <v-text-field
              v-model="editedItem.title"
              label="标题"
              :rules="[v => !!v || '标题不能为空']"
              required
            ></v-text-field>
            <v-textarea
              v-model="editedItem.description"
              label="描述"
              rows="3"
            ></v-textarea>
            <v-textarea
              v-model="editedItem.prompt"
              label="作文提示"
              :rules="[v => !!v || '作文提示不能为空']"
              required
              rows="5"
            ></v-textarea>
            <v-text-field
              v-model="editedItem.wordLimit"
              label="字数限制"
              type="number"
              :rules="[v => v > 0 || '字数限制必须大于0']"
              required
            ></v-text-field>
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
import api from '@/services/api'

// 表格列定义
const headers = [
  { title: '标题', key: 'title' },
  { title: '描述', key: 'description' },
  { title: '字数限制', key: 'wordLimit' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const assignments = ref([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 当前编辑的项目
const editedItem = ref({
  id: '',
  title: '',
  description: '',
  prompt: '',
  wordLimit: 800
})

// 要删除的项目
const itemToDelete = ref(null)

// 获取所有测验
async function fetchAssignments() {
  loading.value = true
  try {
    const response = await api.get('/EssayAssignment')
    assignments.value = response.data || []
  } catch (error) {
    console.error('获取测验列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 编辑测验
function editAssignment(item: any) {
  isEditing.value = true
  editedItem.value = { ...item }
  dialog.value = true
}

// 保存测验
async function saveAssignment() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEditing.value) {
      // 更新现有测验
      await api.put(`/EssayAssignment/${editedItem.value.id}`, editedItem.value)
    } else {
      // 创建新测验
      await api.post('/EssayAssignment', editedItem.value)
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

// 确认删除
function confirmDelete(item: any) {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除测验
async function deleteAssignment() {
  if (!itemToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/EssayAssignment/${itemToDelete.value.id}`)
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
function resetForm() {
  isEditing.value = false
  editedItem.value = {
    id: '',
    title: '',
    description: '',
    prompt: '',
    wordLimit: 800
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignments()
})
</script>
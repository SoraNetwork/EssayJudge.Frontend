<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">API 密钥管理</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewDialog">新建密钥</v-btn>
    </div>

    <!-- API 密钥列表 -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="apiKeys"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
        >
          <template v-slot:item.key="{ item }">
            <v-chip label size="small" class="font-weight-bold">
              {{ item.key.substring(0, 4) }}...{{ item.key.substring(item.key.length - 4) }}
            </v-chip>
          </template>
          <template v-slot:item.isEnabled="{ item }">
            <v-switch
              :model-value="item.isEnabled"
              color="primary"
              hide-details
              @change="toggleEnabled(item)"
            ></v-switch>
          </template>
          <template v-slot:item.createdAt="{ item }">
            {{ new Date(item.createdAt).toLocaleString() }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editApiKey(item)"
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

    <!-- 新建/编辑密钥对话框 -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑密钥' : '新建密钥' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveApiKey">
            <v-select
              v-model="editedItem.serviceType"
              :items="serviceTypes"
              label="服务类型"
              :rules="[v => !!v || '请选择服务类型']"
              required
            ></v-select>
            <v-text-field
              v-model="editedItem.key"
              label="API Key"
              :rules="[v => !!v || 'API Key 不能为空']"
              required
            ></v-text-field>
            <v-text-field
              v-model="editedItem.secret"
              label="Secret (可选)"
              type="password"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.endpoint"
              label="Endpoint (可选)"
            ></v-text-field>
            <v-textarea
              v-model="editedItem.description"
              label="描述 (可选)"
              rows="3"
            ></v-textarea>
            <v-switch
              v-model="editedItem.isEnabled"
              label="启用"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="saveApiKey" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>确定要删除这个 API 密钥吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteApiKey" :loading="deleting">删除</v-btn>
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
  { title: '服务类型', key: 'serviceType' },
  { title: 'Key', key: 'key', sortable: false },
  { title: '描述', key: 'description' },
  { title: '启用', key: 'isEnabled' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
const apiKeys = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

const serviceTypes = ['OpenAI', 'Aliyun', 'DeepL', 'Other']

const defaultItem = {
  id: '',
  serviceType: '',
  key: '',
  secret: '',
  endpoint: '',
  description: '',
  isEnabled: true,
}

// 当前编辑的项目
const editedItem = ref({ ...defaultItem })

// 要删除的项目
const itemToDelete = ref<any>(null)

// 获取所有 API 密钥
const fetchApiKeys = async () => {
  loading.value = true
  try {
    const response = await api.get('/ApiKey')
    apiKeys.value = response.data || []
  } catch (error) {
    console.error('获取 API 密钥列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开新建对话框
const openNewDialog = () => {
  isEditing.value = false
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

// 编辑密钥
const editApiKey = (item: any) => {
  isEditing.value = true
  editedItem.value = { ...item }
  dialog.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialog.value = false
}

// 保存密钥
const saveApiKey = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEditing.value) {
      // 更新现有密钥
      await api.put(`/ApiKey/${editedItem.value.id}`, editedItem.value)
    } else {
      // 创建新密钥
      await api.post('/ApiKey', editedItem.value)
    }
    closeDialog()
    await fetchApiKeys()
  } catch (error) {
    console.error('保存 API 密钥失败:', error)
  } finally {
    saving.value = false
  }
}

// 确认删除
const confirmDelete = (item: any) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除密钥
const deleteApiKey = async () => {
  if (!itemToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/ApiKey/${itemToDelete.value.id}`)
    deleteDialog.value = false
    await fetchApiKeys()
  } catch (error) {
    console.error('删除 API 密钥失败:', error)
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

// 切换启用状态
const toggleEnabled = async (item: any) => {
  const updatedItem = { ...item, isEnabled: !item.isEnabled }
  try {
    await api.put(`/ApiKey/${item.id}`, updatedItem)
    await fetchApiKeys()
  } catch (error) {
    console.error('更新密钥状态失败:', error)
    // Revert UI change on failure
    item.isEnabled = !item.isEnabled
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchApiKeys()
})
</script>

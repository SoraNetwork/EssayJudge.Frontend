<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold">AI 服务管理</h1>
      <!-- 按钮将位于选项卡内 -->
    </div>

    <a-card>
      <a-tabs v-model:activeKey="currentTab">
        <a-tab-pane key="apiKeys" tab="API 密钥管理"></a-tab-pane>
        <a-tab-pane key="modelUsage" tab="AI 模型使用设置"></a-tab-pane>
      </a-tabs>

      <div>
        <!-- API 密钥选项卡 -->
        <div v-show="currentTab === 'apiKeys'">
          <div class="flex justify-end mb-4">
            <a-button type="primary" @click="openNewApiKeyDialog" style="margin-bottom: 8px;">
              <template #icon><PlusOutlined /></template>
              新建密钥
            </a-button>
          </div>
          <div class="responsive-table-container">
            <!-- 桌面端 API 密钥表格 -->
            <a-table
              v-if="display.mdAndUp.value"
              :columns="apiKeyColumns"
              :data-source="apiKeys"
              :loading="apiKeysLoading"
              row-key="id"
              :pagination="{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: any) => `共 ${total} 条`
              }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'key'">
                  <a-tag>{{ record.key.substring(0, 4) }}...{{ record.key.substring(record.key.length - 4) }}</a-tag>
                </template>
                <template v-if="column.key === 'aiModels'">
                  <a-tag v-for="model in record.aiModels" :key="model.id" class="mr-1 mb-1">
                    {{ model.modelId }}
                  </a-tag>
                  <span v-if="!record.aiModels || record.aiModels.length === 0">-</span>
                </template>
                <template v-if="column.key === 'isEnabled'">
                  <a-switch :checked="record.isEnabled" @change="toggleApiKeyEnabled(record)" />
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDateUTC8(record.createdAt) }}
                </template>
                <template v-if="column.key === 'actions'">
                  <a-tooltip title="编辑">
                    <a-button type="text" size="small" @click="editApiKey(record)">
                      <template #icon><EditOutlined /></template>
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除密钥">
                    <a-button type="text" size="small" danger @click="confirmDeleteApiKey(record)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </a-tooltip>
                </template>
              </template>
            </a-table>

            <!-- 移动端 API 密钥列表 -->
            <a-list v-else :data-source="apiKeys" item-layout="horizontal">
              <template #renderItem="{ item }">
                <a-list-item class="mb-2">
                  <a-list-item-meta>
                    <template #title>{{ item.description || '无描述' }}</template>
                    <template #description>
                      {{ item.serviceType }} - {{ formatDateUTC8(item.createdAt) }}
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-button type="text" size="small" @click="editApiKey(item)">
                      <template #icon><EditOutlined /></template>
                    </a-button>
                    <a-button type="text" size="small" danger @click="confirmDeleteApiKey(item)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>

        <!-- 模型使用设置选项卡 -->
        <div v-show="currentTab === 'modelUsage'">
          <div class="flex justify-end mb-4">
            <a-button type="primary" @click="openNewSettingDialog" style="margin-bottom: 8px;">
              <template #icon><PlusOutlined /></template>
              新建设置
            </a-button>
          </div>
          <div class="responsive-table-container">
            <!-- 桌面端模型使用设置表格 -->
            <a-table
              v-if="display.mdAndUp.value"
              :columns="settingColumns"
              :data-source="usageSettings"
              :loading="settingsLoading"
              row-key="id"
              :pagination="{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: any) => `共 ${total} 条`
              }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'aiModel'">
                  <span v-if="record.aiModel">{{ record.aiModel.modelId }} ({{ record.aiModel.serviceType }})</span>
                  <span v-else class="text-red-500">模型不存在</span>
                </template>
                <template v-if="column.key === 'isEnabled'">
                  <a-switch :checked="record.isEnabled" @change="toggleSettingEnabled(record)" />
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDateUTC8(record.createdAt) }}
                </template>
                <template v-if="column.key === 'actions'">
                  <a-button type="text" size="small" @click="editSetting(record)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button type="text" size="small" danger @click="confirmDeleteSetting(record)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </template>
              </template>
            </a-table>

            <!-- 移动端模型使用设置列表 -->
            <a-list v-else :data-source="usageSettings" item-layout="horizontal">
              <template #renderItem="{ item }">
                <a-list-item class="mb-2">
                  <a-list-item-meta>
                    <template #title>{{ item.usageType }}</template>
                    <template #description>
                      <span v-if="item.aiModel">{{ item.aiModel.modelId }}</span>
                      <span v-else class="text-red-500">模型不存在</span>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-button type="text" size="small" @click="editSetting(item)">
                      <template #icon><EditOutlined /></template>
                    </a-button>
                    <a-button type="text" size="small" danger @click="confirmDeleteSetting(item)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 新建/编辑 API 密钥对话框 -->
    <a-modal
      v-model:open="apiKeyDialog"
      :title="isEditingApiKey ? '编辑密钥' : '新建密钥'"
      :confirm-loading="savingApiKey"
      @ok="saveApiKey"
      @cancel="closeApiKeyDialog"
      width="600px"
    >
      <a-form ref="apiKeyForm" :model="editedApiKey" layout="vertical">
        <a-form-item
          label="服务类型"
          name="serviceType"
          :rules="[{ required: true, message: '请选择服务类型' }]"
        >
          <a-select v-model:value="editedApiKey.serviceType" :options="serviceTypeOptions" />
        </a-form-item>
        <a-form-item
          label="API Key"
          name="key"
          :rules="[{ required: true, message: 'API Key 不能为空' }]"
        >
          <a-input v-model:value="editedApiKey.key" />
        </a-form-item>
        <a-form-item label="Secret (可选)" name="secret">
          <a-input-password v-model:value="editedApiKey.secret" />
        </a-form-item>
        <a-form-item label="Endpoint (可选)" name="endpoint">
          <a-input v-model:value="editedApiKey.endpoint" />
        </a-form-item>
        <a-form-item label="描述 (可选)" name="description">
          <a-textarea v-model:value="editedApiKey.description" :rows="3" />
        </a-form-item>

        <!-- AI 模型多选 -->
        <a-form-item label="关联 AI 模型 (输入模型ID，按回车添加)" name="modelIds">
          <a-select
            v-model:value="editedApiKey.modelIds"
            mode="tags"
            :options="modelIdOptions"
            placeholder="输入模型ID，例如 gpt-4o, qwen-max"
          />
        </a-form-item>

        <!-- 常用模型 ID 参考 -->
        <div class="mt-2 text-sm text-gray-500">
          常用模型ID参考:
          <a-tag
            v-for="(model, index) in commonModelReferences"
            :key="index"
            class="mr-1 mb-1 cursor-pointer"
            @click="addModelId(model.id)"
          >
            {{ model.id }} ({{ model.provider }})
          </a-tag>
        </div>

        <a-form-item label="启用" name="isEnabled">
          <a-switch v-model:checked="editedApiKey.isEnabled" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除 API 密钥确认对话框 -->
    <a-modal
      v-model:open="apiKeyDeleteDialog"
      title="确认删除密钥"
      :confirm-loading="deletingApiKey"
      @ok="deleteApiKey"
      @cancel="apiKeyDeleteDialog = false"
    >
      <p>确定要删除这个 API 密钥吗？此操作不可撤销。</p>
    </a-modal>

    <!-- 新建/编辑模型使用设置对话框 -->
    <a-modal
      v-model:open="settingDialog"
      :title="isEditingSetting ? '编辑设置' : '新建设置'"
      :confirm-loading="savingSetting"
      @ok="saveSetting"
      @cancel="closeSettingDialog"
      width="600px"
    >
      <a-form ref="settingForm" :model="editedSetting" layout="vertical">
        <a-form-item
          label="使用场景类型 (Usage Type)"
          name="usageType"
          :rules="[{ required: true, message: '使用场景类型不能为空' }]"
        >
          <a-select v-model:value="editedSetting.usageType" :options="usageTypeOptions" />
        </a-form-item>
        <a-form-item
          label="选择 AI 模型"
          name="aiModelId"
          :rules="[{ required: true, message: '请选择 AI 模型' }]"
        >
          <a-select
            v-model:value="editedSetting.aiModelId"
            :options="availableModelOptions"
            show-search
            :filter-option="filterOption"
          />
        </a-form-item>
        <a-form-item label="启用" name="isEnabled">
          <a-switch v-model:checked="editedSetting.isEnabled" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除模型使用设置确认对话框 -->
    <a-modal
      v-model:open="settingDeleteDialog"
      title="确认删除设置"
      :confirm-loading="deletingSetting"
      @ok="deleteSetting"
      @cancel="settingDeleteDialog = false"
    >
      <p>确定要删除这个 AI 模型使用设置吗？此操作不可撤销。</p>
    </a-modal>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import {
  getApiKeys, createApiKey, updateApiKey, deleteApiKey as deleteApiKeyService, type ApiKey,
  getAIModelUsageSettings, createAIModelUsageSetting, updateAIModelUsageSetting, deleteAIModelUsageSetting, getAllAIModels, type AIModelUsageSetting, type AIModel,
  toggleApiKeyStatus
} from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

// Responsive display detection (Vuetify-independent)
const windowWidth = ref(window.innerWidth)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const display = computed(() => ({
  mdAndUp: { value: windowWidth.value >= 768 }
}))

// --- 选项卡状态 ---
const currentTab = ref('apiKeys'); // 'apiKeys' 或 'modelUsage'

// --- API 密钥管理 ---

// API 密钥的表格列定义
const apiKeyColumns = [
  { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType' ,sorter: (a: any, b: any) => a.serviceType.localeCompare(b.serviceType)},
  { title: 'Key', key: 'key' },
  { title: '关联模型', key: 'aiModels' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '启用', key: 'isEnabled' ,sorter: (a: any, b: any) => Number(a.isEnabled) - Number(b.isEnabled)},
  { title: '创建时间', key: 'createdAt' ,sorter:(a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions' }
]

// API 密钥的数据和状态
const apiKeys = ref<ApiKey[]>([])
const apiKeysLoading = ref(false)
const apiKeyDialog = ref(false)
const apiKeyDeleteDialog = ref(false)
const savingApiKey = ref(false)
const deletingApiKey = ref(false)
const isEditingApiKey = ref(false)
const apiKeyForm = ref<any>(null)

const serviceTypes = ['OpenAI', 'Aliyun', 'DeepL', 'Other']
const serviceTypeOptions = serviceTypes.map(type => ({ label: type, value: type }))

// 为 API 密钥表单定义包含 modelIds 的默认项
const defaultApiKeyItem: Omit<ApiKey, 'createdAt' | 'AIModels'> & { modelIds: string[] } = {
  id: '',
  serviceType: '',
  key: '',
  secret: '',
  endpoint: '',
  description: '',
  isEnabled: true,
  modelIds: []
}

// 当前编辑的 API 密钥项
const editedApiKey = ref({ ...defaultApiKeyItem })

// 待删除的 API 密钥项
const apiKeyToDelete = ref<ApiKey | null>(null)

// 模型ID选项（用于combobox）
const modelIdOptions = computed(() => {
  return commonModelReferences.map(model => ({
    label: model.id,
    value: model.id
  }))
})

// 从参考标签添加模型 ID 的函数（带通知）
const addModelId = (modelId: string) => {
  if (!editedApiKey.value.modelIds.includes(modelId)) {
    editedApiKey.value.modelIds.push(modelId);
    console.log(`已添加模型: ${modelId}`);
  } else {
    console.log(`模型 ${modelId} 已存在`);
  }
}

// 获取所有 API 密钥
const fetchApiKeys = async () => {
  apiKeysLoading.value = true
  try {
    const data = await getApiKeys();
    // 映射获取的数据以包含用于表单的 modelIds
    apiKeys.value = data.map(item => ({
      ...item,
      modelIds: item.aiModels?.map(m => m.modelId) || []
    })) || []
  } catch (error) {
    console.error('获取 API 密钥列表失败:', error)
  } finally {
    apiKeysLoading.value = false
  }
}

// 打开新建 API 密钥对话框
const openNewApiKeyDialog = () => {
  isEditingApiKey.value = false
  editedApiKey.value = { ...defaultApiKeyItem }
  apiKeyDialog.value = true
}

// 编辑 API 密钥
const editApiKey = (item: ApiKey) => {
  isEditingApiKey.value = true
  // 将项目映射到 editedItem 格式，提取 modelIds
  editedApiKey.value = {
    ...item,
    modelIds: item.aiModels?.map(m => m.modelId) || []
  }
  apiKeyDialog.value = true
}

// 关闭 API 密钥对话框
const closeApiKeyDialog = () => {
  apiKeyDialog.value = false
}

// 保存 API 密钥（增强错误处理）
const saveApiKey = async () => {
  try {
    await apiKeyForm.value.validate();
  } catch (error) {
    return;
  }

  savingApiKey.value = true
  try {
    const dataToSave = {
      serviceType: editedApiKey.value.serviceType,
      key: editedApiKey.value.key,
      secret: editedApiKey.value.secret,
      endpoint: editedApiKey.value.endpoint,
      description: editedApiKey.value.description,
      isEnabled: editedApiKey.value.isEnabled,
      modelIds: editedApiKey.value.modelIds || []
    }

    if (isEditingApiKey.value) {
      await updateApiKey(editedApiKey.value.id, dataToSave);
      console.log('API密钥更新成功');
    } else {
      await createApiKey(dataToSave);
      console.log('API密钥创建成功');
    }
    closeApiKeyDialog()
    await fetchApiKeys()
    // 保存成功后刷新页面
    window.location.reload()
  } catch (error: any) {
    console.error('保存 API 密钥失败:', error)
    const errorMessage = error.response?.data?.message || '操作失败，请重试';
    console.error(errorMessage);
  } finally {
    savingApiKey.value = false
  }
}

// 删除 API 密钥（增强错误处理）
const deleteApiKey = async () => {
  if (!apiKeyToDelete.value) return

  deletingApiKey.value = true
  try {
    await deleteApiKeyService(apiKeyToDelete.value.id);
    apiKeyDeleteDialog.value = false;
    console.log('API密钥删除成功');
    // 刷新列表
    await fetchApiKeys();
  } catch (error: any) {
    console.error('删除 API 密钥失败:', error);
    const errorMessage = error.response?.data?.message || '删除失败，请重试';
    console.error(errorMessage);
  } finally {
    deletingApiKey.value = false;
    apiKeyToDelete.value = null;
  }
}

// 确认删除 API 密钥
const confirmDeleteApiKey = (item: ApiKey) => {
  apiKeyToDelete.value = item;
  apiKeyDeleteDialog.value = true;
}

// 切换 API 密钥启用状态
const toggleApiKeyEnabled = async (item: ApiKey) => {
  // 乐观更新 UI
  const originalStatus = item.isEnabled;
  item.isEnabled = !item.isEnabled;

  try {
    await toggleApiKeyStatus(item.id);
    // 如果只是切换状态，则无需重新获取整个列表
  } catch (error) {
    console.error('更新密钥状态失败:', error)
    // 失败时恢复 UI 更改
    item.isEnabled = originalStatus;
    // 可选地向用户显示通知
  }
}


// --- AI 模型使用设置管理 ---

// 使用设置的表格列定义
const settingColumns = [
  { title: '使用场景类型', dataIndex: 'usageType', key: 'usageType', sorter: (a: any, b: any) => a.usageType.localeCompare(b.usageType) },
  { title: 'AI 模型', key: 'aiModel' ,sorter: (a: any, b: any) => {const modelA = a.aiModel ? a.aiModel.modelId : '';const modelB = b.aiModel ? b.aiModel.modelId : '';return modelA.localeCompare(modelB);}},
  { title: '启用', key: 'isEnabled' ,sorter: (a: any, b: any) => Number(a.isEnabled) - Number(b.isEnabled)},
  { title: '创建时间', key: 'createdAt' ,sorter:(a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() },
  { title: '操作', key: 'actions' }
]

// 使用设置的数据和状态
const usageSettings = ref<AIModelUsageSetting[]>([])
const availableModels = ref<AIModel[]>([]) // 所有可用模型的列表
const settingsLoading = ref(false)
const settingDialog = ref(false)
const settingDeleteDialog = ref(false)
const savingSetting = ref(false)
const deletingSetting = ref(false)
const isEditingSetting = ref(false)
const settingForm = ref<any>(null)

// 基于 JudgeService 的预定义使用类型
const usageTypes = ['Judging', 'Reporting', 'OcrProcessing', 'OcrV3', 'Other'];
const usageTypeOptions = usageTypes.map(type => ({ label: type, value: type }))

// 可用模型选项
const availableModelOptions = computed(() => {
  return availableModels.value.map(model => ({
    label: `${model.modelId} (${model.serviceType})`,
    value: model.id
  }))
})

// 搜索过滤函数
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase())
}

// 常用模型 ID 参考（显示在 API 密钥表单中）
const commonModelReferences = [
  { id: "deepseek-r1-distill-qwen-32b", provider: "阿里云" },
  { id: "deepseek-r1-distill-llama-70b", provider: "阿里云" },
  { id: "deepseek-r1-0528", provider: "阿里云" },
  { id: "qwen-plus-latest", provider: "阿里云" },
  { id: "qwen-max-latest", provider: "阿里云" },
  // VolcEngine (火山引擎) 模型
  { id: "doubao-seed-1-6-250615", provider: "火山引擎" },
  { id: "deepseek-r1-250528", provider: "火山引擎" },
  { id: "doubao-seed-1-6-flash-250615", provider: "火山引擎" },
  { id: "doubao-seed-1-6-thinking-250615", provider: "火山引擎" },
  { id: "deepseek-v3-250324", provider: "火山引擎" },
];

// 定义表单所需数据的结构（编辑时包含 id）
type EditedSettingItem = Partial<AIModelUsageSetting>;

const defaultSettingItem: EditedSettingItem = {
  usageType: '',
  aiModelId: '',
  isEnabled: true,
}

// 当前编辑的设置项
const editedSetting = ref<EditedSettingItem>({ ...defaultSettingItem })

// Setting item to delete
const itemToDelete = ref<AIModelUsageSetting | null>(null)

// Fetch all usage settings
const fetchUsageSettings = async () => {
  settingsLoading.value = true
  try {
    const data = await getAIModelUsageSettings();
    usageSettings.value = data || []
  } catch (error) {
    console.error('获取 AI 模型使用设置列表失败:', error)
  } finally {
    settingsLoading.value = false
  }
}

// Fetch all available AI models (needed for the select dropdown)
const fetchAvailableModels = async () => {
  try {
    const data = await getAllAIModels();
    availableModels.value = data || [];
  } catch (error) {
    console.error('获取可用 AI 模型列表失败:', error);
  }
}

// Open new Setting dialog
const openNewSettingDialog = () => {
  isEditingSetting.value = false
  editedSetting.value = { ...defaultSettingItem }
  settingDialog.value = true
}

// Edit setting
const editSetting = (item: AIModelUsageSetting) => {
  isEditingSetting.value = true
  // Assign the full item directly to editedSetting
  editedSetting.value = { ...item };
  settingDialog.value = true
}

// Close Setting dialog
const closeSettingDialog = () => {
  settingDialog.value = false
}

// Save setting
const saveSetting = async () => {
  try {
    await settingForm.value.validate();
  } catch (error) {
    return;
  }

  savingSetting.value = true
  try {
    // Create the data object to send to the API
    // It should only contain the properties allowed by the API function's type
    const dataToSend: Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'> = {
      usageType: editedSetting.value.usageType || '',
      aiModelId: editedSetting.value.aiModelId || '',
      isEnabled: editedSetting.value.isEnabled ?? true,
    };

    if (isEditingSetting.value && editedSetting.value.id) { // Check for id existence when editing
      // Pass id as the first argument and the dataToSend object as the second
      await updateAIModelUsageSetting(editedSetting.value.id, dataToSend);
    } else {
      // Pass dataToSend for creation
      await createAIModelUsageSetting(dataToSend);
    }
    closeSettingDialog()
    await fetchUsageSettings() // Refresh the list
  } catch (error) {
    console.error('保存 AI 模型使用设置失败:', error)
    // TODO: Show user-friendly error message, e.g., if UsageType already exists
  } finally {
    savingSetting.value = false
  }
}

// Confirm delete Setting
const confirmDeleteSetting = (item: AIModelUsageSetting) => {
  itemToDelete.value = item
  settingDeleteDialog.value = true
}

// Delete setting
const deleteSetting = async () => {
  if (!itemToDelete.value || !itemToDelete.value.id) return

  deletingSetting.value = true
  try {
    await deleteAIModelUsageSetting(itemToDelete.value.id);
    settingDeleteDialog.value = false
    await fetchUsageSettings() // Refresh the list
  } catch (error) {
    console.error('删除 AI 模型使用设置失败:', error)
  } finally {
    deletingSetting.value = false
    itemToDelete.value = null
  }
}

// Toggle Setting enabled status
const toggleSettingEnabled = async (item: AIModelUsageSetting) => {
  if (!item.id) return;
  // Optimistically update UI
  const originalStatus = item.isEnabled;
  item.isEnabled = !item.isEnabled;

  try {
    // Send the ID and an object containing the required fields + the updated field
    // Ensure all required fields for the backend model are sent
    await updateAIModelUsageSetting(item.id, {
      usageType: item.usageType, // Include existing usageType
      isEnabled: item.isEnabled // Include the new isEnabled status
    });
    // No need to refetch the whole list if only toggling status
  } catch (error) {
    console.error('更新设置状态失败:', error)
    // Revert UI change on failure
    item.isEnabled = originalStatus;
    // Optionally show a user notification
  }
}

// lifecycle hooks
onMounted(() => {
  // 初始加载所需数据
  fetchApiKeys();
  fetchUsageSettings();
  fetchAvailableModels();
});

</script>
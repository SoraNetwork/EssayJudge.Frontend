<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">AI 服务管理</h1>
      <!-- 按钮将位于选项卡内 -->
    </div>

    <v-card>
      <v-tabs v-model="currentTab" color="primary">
        <v-tab value="apiKeys">API 密钥管理</v-tab>
        <v-tab value="modelUsage">AI 模型使用设置</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="currentTab">
          <!-- API 密钥选项卡 -->
          <v-window-item value="apiKeys">
            <div class="d-flex justify-end mb-4">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewApiKeyDialog">新建密钥</v-btn>
            </div>
            <div class="responsive-table-container">
              <!-- 桌面端 API 密钥表格 -->
              <v-data-table v-if="display.mdAndUp.value" :headers="apiKeyHeaders" :items="apiKeys" :loading="apiKeysLoading" loading-text="加载中..."
                no-data-text="暂无数据">
                <template v-slot:item.key="{ item }">
                  <v-chip label size="small" class="font-weight-bold">
                    {{ item.key.substring(0, 4) }}...{{ item.key.substring(item.key.length - 4) }}
                  </v-chip>
                </template>
                <template v-slot:item.aiModels="{ item }">
                  <v-chip v-for="model in item.aiModels" :key="model.id" label size="x-small" class="ma-1">
                    {{ model.modelId }}
                  </v-chip>
                  <span v-if="!item.aiModels || item.aiModels.length === 0">-</span>
                </template>
                <template v-slot:item.isEnabled="{ item }">
                  <v-switch :model-value="item.isEnabled" color="primary" hide-details
                    @change="toggleApiKeyEnabled(item)"></v-switch>
                </template>
                <template v-slot:item.createdAt="{ item }">
                  {{ formatDateUTC8(item.createdAt) }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon variant="text" size="small" @click="editApiKey(item)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteApiKey(item)">
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">删除密钥</v-tooltip>
                  </v-btn>
                </template>
              </v-data-table>

              <!-- 移动端 API 密钥列表 -->
              <v-list v-else>
                <v-list-item v-for="item in apiKeys" :key="item.id" class="mb-2">
                  <v-list-item-content>
                    <v-list-item-title>{{ item.description || '无描述' }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ item.serviceType }} - {{ formatDateUTC8(item.createdAt) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <template v-slot:append>
                    <v-btn icon variant="text" size="small" @click="editApiKey(item)">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteApiKey(item)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-window-item>

          <!-- 模型使用设置选项卡 -->
          <v-window-item value="modelUsage">
            <div class="d-flex justify-end mb-4">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewSettingDialog">新建设置</v-btn>
            </div>
            <div class="responsive-table-container">
              <!-- 桌面端模型使用设置表格 -->
              <v-data-table v-if="display.mdAndUp.value" :headers="settingHeaders" :items="usageSettings" :loading="settingsLoading"
                loading-text="加载中..." no-data-text="暂无数据">
                <template v-slot:item.aiModel="{ item }">
                  <span v-if="item.aiModel">{{ item.aiModel.modelId }} ({{ item.aiModel.serviceType }})</span>
                  <span v-else class="text-error">模型不存在</span>
                </template>
                <template v-slot:item.isEnabled="{ item }">
                  <v-switch :model-value="item.isEnabled" color="primary" hide-details
                    @change="toggleSettingEnabled(item)"></v-switch>
                </template>
                <template v-slot:item.createdAt="{ item }">
                  {{ formatDateUTC8(item.createdAt) }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon variant="text" size="small" @click="editSetting(item)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteSetting(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>

              <!-- 移动端模型使用设置列表 -->
              <v-list v-else>
                <v-list-item v-for="item in usageSettings" :key="item.id" class="mb-2">
                  <v-list-item-content>
                    <v-list-item-title>{{ item.usageType }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <span v-if="item.aiModel">{{ item.aiModel.modelId }}</span>
                      <span v-else class="text-error">模型不存在</span>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <template v-slot:append>
                    <v-btn icon variant="text" size="small" @click="editSetting(item)">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteSetting(item)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- 新建/编辑 API 密钥对话框 -->
    <v-dialog v-model="apiKeyDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditingApiKey ? '编辑密钥' : '新建密钥' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="apiKeyForm" @submit.prevent="saveApiKey">
            <v-select v-model="editedApiKey.serviceType" :items="serviceTypes" label="服务类型"
              :rules="[v => !!v || '请选择服务类型']" required></v-select>
            <v-text-field v-model="editedApiKey.key" label="API Key" :rules="[v => !!v || 'API Key 不能为空']"
              required></v-text-field>
            <v-text-field v-model="editedApiKey.secret" label="Secret (可选)" type="password"></v-text-field>
            <v-text-field v-model="editedApiKey.endpoint" label="Endpoint (可选)"></v-text-field>
            <v-textarea v-model="editedApiKey.description" label="描述 (可选)" rows="3"></v-textarea>

            <!-- AI 模型多选 -->
            <v-combobox v-model="editedApiKey.modelIds" label="关联 AI 模型 (输入模型ID，按回车添加)" multiple chips clearable
              hint="输入模型ID，例如 gpt-4o, qwen-max" persistent-hint></v-combobox>

            <!-- 常用模型 ID 参考 -->
            <div class="mt-2 text-caption">
              常用模型ID参考:
              <v-chip v-for="(model, index) in commonModelReferences" :key="index" label size="x-small" class="ma-1"
                variant="outlined" @click="addModelId(model.id)">
                {{ model.id }} ({{ model.provider }})
              </v-chip>
            </div>


            <v-switch v-model="editedApiKey.isEnabled" label="启用" color="primary"></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeApiKeyDialog">取消</v-btn>
          <v-btn color="primary" @click="saveApiKey" :loading="savingApiKey">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除 API 密钥确认对话框 -->
    <v-dialog v-model="apiKeyDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除密钥</v-card-title>
        <v-card-text>确定要删除这个 API 密钥吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="apiKeyDeleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteApiKey" :loading="deletingApiKey">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新建/编辑模型使用设置对话框 -->
    <v-dialog v-model="settingDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditingSetting ? '编辑设置' : '新建设置' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="settingForm" @submit.prevent="saveSetting">
            <v-select v-model="editedSetting.usageType" :items="usageTypes" label="使用场景类型 (Usage Type)"
              :rules="[v => !!v || '使用场景类型不能为空']" required></v-select>
            <v-select v-model="editedSetting.aiModelId" :items="availableModels" item-title="modelId" item-value="id"
              label="选择 AI 模型" :rules="[v => !!v || '请选择 AI 模型']" required>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="`${item.raw.modelId} (${item.raw.serviceType})`"></v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                {{ item.raw.modelId }} ({{ item.raw.serviceType }})
              </template>
            </v-select>
            <v-switch v-model="editedSetting.isEnabled" label="启用" color="primary"></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeSettingDialog">取消</v-btn>
          <v-btn color="primary" @click="saveSetting" :loading="savingSetting">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除模型使用设置确认对话框 -->
    <v-dialog v-model="settingDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除设置</v-card-title>
        <v-card-text>确定要删除这个 AI 模型使用设置吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="settingDeleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteSetting" :loading="deletingSetting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import {
  getApiKeys, createApiKey, updateApiKey, deleteApiKey as deleteApiKeyService, type ApiKey,
  getAIModelUsageSettings, createAIModelUsageSetting, updateAIModelUsageSetting, deleteAIModelUsageSetting, getAllAIModels, type AIModelUsageSetting, type AIModel,
  toggleApiKeyStatus
} from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';

const display = useDisplay()

// --- 选项卡状态 ---
const currentTab = ref('apiKeys'); // 'apiKeys' 或 'modelUsage'

// --- API 密钥管理 ---

// API 密钥的表格列定义
const apiKeyHeaders = [
  { title: '服务类型', key: 'serviceType' },
  { title: 'Key', key: 'key', sortable: false },
  { title: '关联模型', key: 'aiModels', sortable: false }, // 修改:AIModels -> aiModels
  { title: '描述', key: 'description' },
  { title: '启用', key: 'isEnabled' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
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

// 从参考标签添加模型 ID 的函数（带通知）
const addModelId = (modelId: string) => {
  if (!editedApiKey.value.modelIds.includes(modelId)) {
    editedApiKey.value.modelIds.push(modelId);
    // 可以在这里添加提示信息
    console.log(`已添加模型: ${modelId}`);
  } else {
    // 可以在这里添加提示信息
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
      modelIds: item.aiModels?.map(m => m.modelId) || [] // 修改:AIModels -> aiModels
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
  const { valid } = await apiKeyForm.value.validate()
  if (!valid) return

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
const settingHeaders = [
  { title: '使用场景类型', key: 'usageType' },
  { title: 'AI 模型', key: 'aiModel' },
  { title: '启用', key: 'isEnabled' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
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
const usageTypes = ['Judging', 'Reporting', 'OcrProcessing', 'OcrV3' ,'Other'];

// 常用模型 ID 参考（显示在 API 密钥表单中）
const commonModelReferences = [
  { id: "deepseek-r1-distill-qwen-32b", provider: "阿里云" },
  { id: "deepseek-r1-distill-llama-70b", provider: "阿里云" },
  { id: "deepseek-r1-0528", provider: "阿里云" },
  { id: "qwen-plus-latest", provider: "阿里云" },
  { id: "qwen-max-latest", provider: "阿里云" }, // 根据常用模型更正了拼写错误
  // VolcEngine (火山引擎) 模型
  { id: "doubao-seed-1-6-250615", provider: "火山引擎" },
  { id: "deepseek-r1-250528", provider: "火山引擎" },
  { id: "doubao-seed-1-6-flash-250615", provider: "火山引擎" },
  { id: "doubao-seed-1-6-thinking-250615", provider: "火山引擎" },
  { id: "deepseek-v3-250324", provider: "火山引擎" },
  // OpenAI 模型 
  //{ id: "gpt-4o", provider: "OpenAI" },
  //{ id: "gpt-3.5-turbo", provider: "OpenAI" },
  // Anthropic 模型
  //{ id: "claude-3-opus-20240229", provider: "Anthropic" },
  //{ id: "claude-3-sonnet-20240229", provider: "Anthropic" },
  //{ id: "claude-3-haiku-20240307", provider: "Anthropic" },
  // 根据需要添加其他常用模型 
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
  const { valid } = await settingForm.value.validate()
  if (!valid) return

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
      //aiModelId: item.id, // Include existing aiModelId
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

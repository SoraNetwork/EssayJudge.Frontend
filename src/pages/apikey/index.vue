<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">AI 服务管理</h1>
      <!-- Buttons will be inside tabs -->
    </div>

    <v-card>
      <v-tabs v-model="currentTab" color="primary">
        <v-tab value="apiKeys">API 密钥管理</v-tab>
        <v-tab value="modelUsage">AI 模型使用设置</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="currentTab">
          <!-- API Keys Tab -->
          <v-window-item value="apiKeys">
            <div class="d-flex justify-end mb-4">
               <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewApiKeyDialog">新建密钥</v-btn>
            </div>
            <v-data-table
              :headers="apiKeyHeaders"
              :items="apiKeys"
              :loading="apiKeysLoading"
              loading-text="加载中..."
              no-data-text="暂无数据"
            >
              <template v-slot:item.key="{ item }">
                <v-chip label size="small" class="font-weight-bold">
                  {{ item.key.substring(0, 4) }}...{{ item.key.substring(item.key.length - 4) }}
                </v-chip>
              </template>
              <template v-slot:item.AIModels="{ item }">
                 <v-chip
                    v-for="model in item.AIModels"
                    :key="model.id"
                    label
                    size="x-small"
                    class="ma-1"
                 >
                    {{ model.modelId }}
                 </v-chip>
                 <span v-if="!item.AIModels || item.AIModels.length === 0">-</span>
              </template>
              <template v-slot:item.isEnabled="{ item }">
                <v-switch
                  :model-value="item.isEnabled"
                  color="primary"
                  hide-details
                  @change="toggleApiKeyEnabled(item)"
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
                  @click="confirmDeleteApiKey(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Model Usage Settings Tab -->
          <v-window-item value="modelUsage">
             <div class="d-flex justify-end mb-4">
               <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewSettingDialog">新建设置</v-btn>
            </div>
            <v-data-table
              :headers="settingHeaders"
              :items="usageSettings"
              :loading="settingsLoading"
              loading-text="加载中..."
              no-data-text="暂无数据"
            >
              <template v-slot:item.aiModel="{ item }">
                <span v-if="item.aiModel">{{ item.aiModel.modelId }} ({{ item.aiModel.serviceType }})</span>
                <span v-else class="text-error">模型不存在</span>
              </template>
              <template v-slot:item.isEnabled="{ item }">
                <v-switch
                  :model-value="item.isEnabled"
                  color="primary"
                  hide-details
                  @change="toggleSettingEnabled(item)"
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
                  @click="editSetting(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDeleteSetting(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- New/Edit API Key Dialog -->
    <v-dialog v-model="apiKeyDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditingApiKey ? '编辑密钥' : '新建密钥' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="apiKeyForm" @submit.prevent="saveApiKey">
            <v-select
              v-model="editedApiKey.serviceType"
              :items="serviceTypes"
              label="服务类型"
              :rules="[v => !!v || '请选择服务类型']"
              required
            ></v-select>
            <v-text-field
              v-model="editedApiKey.key"
              label="API Key"
              :rules="[v => !!v || 'API Key 不能为空']"
              required
            ></v-text-field>
            <v-text-field
              v-model="editedApiKey.secret"
              label="Secret (可选)"
              type="password"
            ></v-text-field>
            <v-text-field
              v-model="editedApiKey.endpoint"
              label="Endpoint (可选)"
            ></v-text-field>
            <v-textarea
              v-model="editedApiKey.description"
              label="描述 (可选)"
              rows="3"
            ></v-textarea>

            <!-- AI Models Multi-select -->
            <v-combobox
               v-model="editedApiKey.modelIds"
               label="关联 AI 模型 (输入模型ID，按回车添加)"
               multiple
               chips
               clearable
               hint="输入模型ID，例如 gpt-4o, qwen-max"
               persistent-hint
            ></v-combobox>

            <!-- Common Model IDs Reference -->
            <div class="mt-2 text-caption">
                常用模型ID参考:
                <v-chip
                    v-for="(model, index) in commonModelReferences"
                    :key="index"
                    label
                    size="x-small"
                    class="ma-1"
                    variant="outlined"
                >
                    {{ model.id }} ({{ model.provider }})
                </v-chip>
            </div>


            <v-switch
              v-model="editedApiKey.isEnabled"
              label="启用"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeApiKeyDialog">取消</v-btn>
          <v-btn color="primary" @click="saveApiKey" :loading="savingApiKey">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete API Key Confirmation Dialog -->
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

    <!-- New/Edit Model Usage Setting Dialog -->
    <v-dialog v-model="settingDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditingSetting ? '编辑设置' : '新建设置' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="settingForm" @submit.prevent="saveSetting">
            <v-select
              v-model="editedSetting.usageType"
              :items="usageTypes"
              label="使用场景类型 (Usage Type)"
              :rules="[v => !!v || '使用场景类型不能为空']"
              required
            ></v-select>
            <v-select
              v-model="editedSetting.aiModelId"
              :items="availableModels"
              item-title="modelId"
              item-value="id"
              label="选择 AI 模型"
              :rules="[v => !!v || '请选择 AI 模型']"
              required
            >
              <template v-slot:item="{ props, item }">
                 <v-list-item
                    v-bind="props"
                    :title="`${item.raw.modelId} (${item.raw.serviceType})`"
                 ></v-list-item>
              </template>
               <template v-slot:selection="{ item }">
                 {{ item.raw.modelId }} ({{ item.raw.serviceType }})
              </template>
            </v-select>
            <v-switch
              v-model="editedSetting.isEnabled"
              label="启用"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeSettingDialog">取消</v-btn>
          <v-btn color="primary" @click="saveSetting" :loading="savingSetting">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Model Usage Setting Confirmation Dialog -->
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  getApiKeys, createApiKey, updateApiKey, deleteApiKey as deleteApiKeyService, type ApiKey,
  getAIModelUsageSettings, createAIModelUsageSetting, updateAIModelUsageSetting, deleteAIModelUsageSetting, getAllAIModels, type AIModelUsageSetting, type AIModel
} from '@/services/apiService';

// --- Tab State ---
const currentTab = ref('apiKeys'); // 'apiKeys' or 'modelUsage'

// --- API Key Management ---

// Table column definitions for API Keys
const apiKeyHeaders = [
  { title: '服务类型', key: 'serviceType' },
  { title: 'Key', key: 'key', sortable: false },
  { title: '关联模型', key: 'AIModels', sortable: false },
  { title: '描述', key: 'description' },
  { title: '启用', key: 'isEnabled' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// Data and state for API Keys
const apiKeys = ref<ApiKey[]>([])
const apiKeysLoading = ref(false)
const apiKeyDialog = ref(false)
const apiKeyDeleteDialog = ref(false)
const savingApiKey = ref(false)
const deletingApiKey = ref(false)
const isEditingApiKey = ref(false)
const apiKeyForm = ref<any>(null)

const serviceTypes = ['OpenAI', 'Aliyun', 'DeepL', 'Other']

// Define default item with modelIds for API Key form
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

// Current edited API Key item
const editedApiKey = ref({ ...defaultApiKeyItem })

// API Key item to delete
const apiKeyToDelete = ref<ApiKey | null>(null)

// Fetch all API keys
const fetchApiKeys = async () => {
  apiKeysLoading.value = true
  try {
    const data = await getApiKeys();
    // Map the fetched data to include modelIds for the form
    apiKeys.value = data.map(item => ({
        ...item,
        modelIds: item.AIModels?.map(m => m.modelId) || []
    })) || []
  } catch (error) {
    console.error('获取 API 密钥列表失败:', error)
  } finally {
    apiKeysLoading.value = false
  }
}

// Open new API Key dialog
const openNewApiKeyDialog = () => {
  isEditingApiKey.value = false
  editedApiKey.value = { ...defaultApiKeyItem }
  apiKeyDialog.value = true
}

// Edit API key
const editApiKey = (item: ApiKey) => {
  isEditingApiKey.value = true
  // Map the item to the editedItem format, extracting modelIds
  editedApiKey.value = {
    ...item,
    modelIds: item.AIModels?.map(m => m.modelId) || []
  }
  apiKeyDialog.value = true
}

// Close API Key dialog
const closeApiKeyDialog = () => {
  apiKeyDialog.value = false
}

// Save API key
const saveApiKey = async () => {
  const { valid } = await apiKeyForm.value.validate()
  if (!valid) return

  savingApiKey.value = true
  try {
    const dataToSave = {
        ...editedApiKey.value,
        modelIds: editedApiKey.value.modelIds
    }
    if (isEditingApiKey.value) {
      await updateApiKey(editedApiKey.value.id, dataToSave);
    } else {
      await createApiKey(dataToSave);
    }
    closeApiKeyDialog()
    await fetchApiKeys()
  } catch (error) {
    console.error('保存 API 密钥失败:', error)
  } finally {
    savingApiKey.value = false
  }
}

// Confirm delete API Key
const confirmDeleteApiKey = (item: ApiKey) => {
  apiKeyToDelete.value = item
  apiKeyDeleteDialog.value = true
}

// Delete API key
const deleteApiKey = async () => {
  if (!apiKeyToDelete.value) return

  deletingApiKey.value = true
  try {
    await deleteApiKeyService(apiKeyToDelete.value.id);
    apiKeyDeleteDialog.value = false
    await fetchApiKeys()
  } catch (error) {
    console.error('删除 API 密钥失败:', error)
  } finally {
    deletingApiKey.value = false
    apiKeyToDelete.value = null
  }
}

// Toggle API Key enabled status
const toggleApiKeyEnabled = async (item: ApiKey) => {
  // Optimistically update UI
  const originalStatus = item.isEnabled;
  item.isEnabled = !item.isEnabled;

  try {
    await updateApiKey(item.id, { isEnabled: item.isEnabled });
    // No need to refetch the whole list if only toggling status
  } catch (error) {
    console.error('更新密钥状态失败:', error)
    // Revert UI change on failure
    item.isEnabled = originalStatus;
    // Optionally show a user notification
  }
}


// --- AI Model Usage Settings Management ---

// Table column definitions for Usage Settings
const settingHeaders = [
  { title: '使用场景类型', key: 'usageType' },
  { title: 'AI 模型', key: 'aiModel' },
  { title: '启用', key: 'isEnabled' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

// Data and state for Usage Settings
const usageSettings = ref<AIModelUsageSetting[]>([])
const availableModels = ref<AIModel[]>([]) // List of all available models
const settingsLoading = ref(false)
const settingDialog = ref(false)
const settingDeleteDialog = ref(false)
const savingSetting = ref(false)
const deletingSetting = ref(false)
const isEditingSetting = ref(false)
const settingForm = ref<any>(null)

// Predefined Usage Types based on JudgeService
const usageTypes = ['Judging', 'Reporting', 'OcrProcessing', 'Other'];

// Common Model IDs for reference (displayed in the API Key form)
const commonModelReferences = [
    { id: "deepseek-r1-distill-qwen-32b", provider: "阿里云" },
    { id: "deepseek-r1-distill-llama-70b", provider: "阿里云" },
    { id: "deepseek-r1-0528", provider: "阿里云" },
    { id: "qwen-plus-latest", provider: "阿里云" },
    { id: "qwen-max-latest", provider: "阿里云" }, // Corrected typo based on common models
    // VolcEngine (火山引擎) models
    { id: "doubao-seed-1-6-250615", provider: "火山引擎" },
    { id: "deepseek-r1-250528", provider: "火山引擎" },
    { id: "doubao-seed-1-6-flash-250615", provider: "火山引擎" },
    { id: "doubao-seed-1-6-thinking-250615", provider: "火山引擎" },
    { id: "deepseek-v3-250324", provider: "火山引擎" },
    // OpenAI models
    { id: "gpt-4o", provider: "OpenAI" },
    { id: "gpt-3.5-turbo", provider: "OpenAI" },
    // Anthropic models
    { id: "claude-3-opus-20240229", provider: "Anthropic" },
    { id: "claude-3-sonnet-20240229", provider: "Anthropic" },
    { id: "claude-3-haiku-20240307", provider: "Anthropic" },
    // Add other common models as needed
];


// Define the shape of the data needed for the form (includes id when editing)
type EditedSettingItem = Partial<AIModelUsageSetting>;

const defaultSettingItem: EditedSettingItem = {
  usageType: '',
  aiModelId: '',
  isEnabled: true,
}

// Current edited Setting item
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
      aiModelId: item.aiModelId, // Include existing aiModelId
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


// --- Lifecycle Hooks and Watchers ---

// Fetch data on page mount
onMounted(() => {
  // Fetch data for the initial tab
  if (currentTab.value === 'apiKeys') {
    fetchApiKeys();
  } else {
    fetchUsageSettings();
    fetchAvailableModels(); // Models are needed for the settings tab
  }
});

// Watch for tab changes to fetch data if needed
watch(currentTab, (newTab) => {
  if (newTab === 'apiKeys' && apiKeys.value.length === 0 && !apiKeysLoading.value) {
    fetchApiKeys();
  } else if (newTab === 'modelUsage' && usageSettings.value.length === 0 && !settingsLoading.value) {
    fetchUsageSettings();
  }
  // Always fetch available models when switching to the modelUsage tab
  if (newTab === 'modelUsage' && availableModels.value.length === 0) {
      fetchAvailableModels();
  }
});

</script>

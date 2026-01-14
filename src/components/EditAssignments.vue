<template>
  <a-modal
    v-model:open="dialog"
    :title="isEditing ? '编辑测验' : '新建测验'"
    :width="700"
    @cancel="closeDialog"
    :footer="null"
  >
    <a-form
      :model="localEditedItem"
      layout="vertical"
      @finish="saveAssignment"
    >
      <a-form-item
        label="选择年级"
        name="grade"
        :rules="[{ required: true, message: '请选择年级' }]"
      >
        <a-select
          v-model:value="localEditedItem.grade"
          :options="grades.map(g => ({ label: g.grade, value: g.string }))"
          placeholder="请选择年级"
        />
      </a-form-item>

      <a-form-item
        label="标题"
        name="titleContext"
      >
        <a-textarea
          v-model:value="localEditedItem.titleContext"
          placeholder="请输入标题"
          :rows="3"
        />
      </a-form-item>

      <a-form-item
        label="描述"
        name="description"
      >
        <a-textarea
          v-model:value="localEditedItem.description"
          placeholder="请输入描述"
          :rows="1"
        />
      </a-form-item>

      <a-form-item
        label="总分"
        name="totalScore"
        :rules="[
          { required: true, message: '请输入总分' },
          { type: 'number', min: 0, message: '总分必须大于0' }
        ]"
      >
        <a-input-number
          v-model:value="localEditedItem.totalScore"
          placeholder="请输入总分"
          :min="0"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="基础分"
        name="baseScore"
        :rules="[
          { required: true, message: '请输入基础分' },
          { type: 'number', min: 0, message: '基础分必须大于0' }
        ]"
      >
        <a-input-number
          v-model:value="localEditedItem.baseScore"
          placeholder="请输入基础分"
          :min="0"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="评分标准"
        name="scoringCriteria"
      >
        <a-textarea
          v-model:value="localEditedItem.scoringCriteria"
          placeholder="请输入评分标准"
          :rows="10"
        />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 0, span: 24 }">
        <a-space>
          <a-button @click="closeDialog">取消</a-button>
          <a-button type="primary" html-type="submit" :loading="saving">
            保存
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 定义组件的属性
const props = defineProps<{
  modelValue: boolean
  editedItem: any
  isEditing: boolean
}>()

// 定义组件的事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:editedItem', value: any): void
  (e: 'save', value: any): void
}>()

// 定义年级选项
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

// 对话框状态
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 本地编辑项，用于双向绑定
const localEditedItem = computed({
  get: () => props.editedItem,
  set: (value) => emit('update:editedItem', value)
})

// 保存状态
const saving = ref(false)

// 保存测验
function saveAssignment() {
  saving.value = true
  emit('save', localEditedItem.value)
  // 注意：这里不设置 saving.value = false，因为父组件会控制
}

// 关闭对话框
function closeDialog() {
  dialog.value = false
}
</script>

<style scoped>
</style>
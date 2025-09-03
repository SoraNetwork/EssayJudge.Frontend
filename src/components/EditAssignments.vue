<template>
  <v-dialog v-model="dialog" max-width="700px">
    <v-card>
      <v-card-title class="text-h5">{{ isEditing ? '编辑测验' : '新建测验' }}</v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="saveAssignment">
          <!-- 年级选择 -->
          <v-select v-model="localEditedItem.grade" :items="grades" item-title="grade" item-value="string" label="选择年级"
            required></v-select>
          <!-- 标题输入 -->
          <v-textarea v-model="localEditedItem.titleContext" label="标题" rows="3"></v-textarea>
          <!-- 描述输入 -->
          <v-textarea v-model="localEditedItem.description" label="描述" rows="1"></v-textarea>
          <!-- 总分输入 -->
          <v-text-field v-model="localEditedItem.totalScore" label="总分" type="number"
            :rules="[v => (v !== null && v !== undefined && v > 0) || '总分必须大于0']" required></v-text-field>
          <!-- 基础分输入 -->
          <v-text-field v-model="localEditedItem.baseScore" label="基础分" type="number"
            :rules="[v => (v !== null && v !== undefined && v > 0) || '基础分必须大于0']" required></v-text-field>
          <!-- 评分标准输入 -->
          <v-textarea v-model="localEditedItem.scoringCriteria" label="评分标准" rows="10"></v-textarea>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- 取消按钮 -->
        <v-btn color="error" variant="text" @click="closeDialog">取消</v-btn>
        <!-- 保存按钮 -->
        <v-btn color="primary" @click="saveAssignment" :loading="saving">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 定义组件的属性
const props = defineProps<{
  modelValue: boolean
  editedItem: any
  isEditing: boolean
  saving: boolean
}>()

// 定义组件发出的事件
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

// 表单引用
const form = ref<any>(null)

// 关闭对话框
const closeDialog = () => {
  dialog.value = false
}

// 保存测验
const saveAssignment = async () => {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  emit('save', localEditedItem.value)
}

// 监听对话框关闭事件，重置表单
watch(dialog, (newValue) => {
  if (!newValue) {
    form.value?.resetValidation()
  }
})
</script>
<template>
  <v-container>
    <!-- 上方筛选窗体 -->
    <v-row class="mb-4" align="center">
      <!-- 新增：提交批阅按钮 -->
      <v-col cols="auto">
        <v-btn color="success" @click="showSubmitDialog = true">提交批阅</v-btn>
      </v-col>
      <!-- 时间控件 -->
      <v-col cols="12" md="4">
        <v-menu
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="dateRangeText"
              label="写作日期范围"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="props"
            />
          </template>
          <v-date-picker
            v-model="dateRange"
            range
            @change="onDateChange"
            :max="today"
          />
        </v-menu>
      </v-col>
      <!-- 测验控件 -->
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedAssignment"
          :items="assignmentOptions"
          item-title="title"
          item-value="id"
          label="测验"
          clearable
        />
      </v-col>
      <!-- 最近控件 -->
      <v-col cols="12" md="4">
        <v-text-field
          v-model.number="topCount"
          type="number"
          min="1"
          label="最近X篇"
          placeholder="全部"
          clearable
        />
      </v-col>
      <v-col cols="12" class="text-right">
        <v-btn color="primary" @click="fetchEssays">筛选</v-btn>
      </v-col>
    </v-row>

    <!-- 下方作文条目列表 -->
    <v-card>
      <v-list>
        <v-list-item
          v-for="essay in essays"
          :key="essay.id"
          class="border-b"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ essay.title ?? '' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              学生：{{ essay.studentName ?? '' }}　时间：{{ essay.createdAt ? essay.createdAt.slice(0,10) : '' }}　分数：{{ essay.finalScore ?? '未评分' }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn color="primary" @click="goToDetail(essay.id)" size="small">详细信息</v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-list-item v-if="essays.length === 0">
          <v-list-item-content>
            <v-list-item-title>暂无符合条件的作文</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- 提交批阅分步弹窗 -->
    <v-dialog v-model="showSubmitDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>
          <span v-if="submitStep===1">选择作文题目</span>
          <span v-else-if="submitStep===2">上传作文图片与栏目数</span>
          <span v-else-if="submitStep===3">正在提交批阅</span>
          <span v-else>完成</span>
        </v-card-title>
        <v-card-text>
          <!-- 步骤1：选择题目 -->
          <div v-if="submitStep===1">
            <v-select
              v-model="submitAssignmentId"
              :items="submitAssignmentOptions"
              item-title="titleContext"
              item-value="id"
              label="选择作文题目"
              required
            />
          </div>
          <!-- 步骤2：上传图片与栏目数 -->
          <div v-else-if="submitStep===2">
            <v-file-input
              v-model="submitImages"
              label="上传作文图片（最多5张）"
              accept="image/*"
              multiple
              :counter="true"
              :show-size="true"
              :rules="[v => !v || v.length <= 5 || '最多只能上传5张图片']"
              required
            />
            <v-text-field
              v-model.number="submitColumnCount"
              label="作文栏目数"
              type="number"
              min="1"
              step="1"
              required
              :rules="[v => !!v && Number.isInteger(Number(v)) && v > 0 || '请输入正整数']"
              class="mt-4"
            />
          </div>
          <!-- 步骤3：等待批阅 -->
          <div v-else-if="submitStep===3" class="text-center py-8">
            <v-progress-circular :value="(submitCounter/submitTotal)*100" size="64" width="8" color="primary" :indeterminate="submitTotal===0"/>
            <div class="mt-4">正在提交第 {{ submitCounter+1 }} / {{ submitTotal }} 张图片...</div>
          </div>
          <!-- 步骤4：完成 -->
          <div v-else class="text-center py-8">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
            <div class="text-h6 mt-2 mb-4">完成</div>
            <v-btn color="primary" @click="closeSubmitDialog">完成</v-btn>
          </div>
        </v-card-text>
        <v-card-actions v-if="submitStep<=2">
          <v-spacer />
          <v-btn v-if="submitStep>1" text @click="submitStep--">上一步</v-btn>
          <v-btn color="primary" :disabled="!canNextStep" @click="handleNextStep">
            {{ submitStep===2 ? '开始提交' : '下一步' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 日期控件
const dateMenu = ref(false)
const dateRange = ref<[string, string] | null>(null)
const today = new Date().toISOString().slice(0, 10)
const dateRangeText = computed(() => {
  if (!dateRange.value) return ''
  const [start, end] = dateRange.value
  if (!start && !end) return ''
  if (start && end) return `${start} ~ ${end}`
  return start || end
})
const onDateChange = (val: any) => {
  dateMenu.value = false
}

// 测验控件
const assignmentOptions = ref<{id:string, title:string}[]>([])
const selectedAssignment = ref<string | null>(null)

// 最近控件
const topCount = ref<number | null>(null)

// 作文列表
const essays = ref<any[]>([])

// 获取测验列表
const fetchAssignments = async () => {
  const res = await axios.get('/EssayAssignment')
  assignmentOptions.value = (res.data || []).map((a:any) => ({
    id: a.id,
    title: a.titleContext || a.title || '（无标题）'
  }))
}

// 获取作文列表
const fetchEssays = async () => {
  // 先查作文
  let params: any = {}
  if (topCount.value) params.top = topCount.value
  if (selectedAssignment.value) params.title = assignmentOptions.value.find(a=>a.id===selectedAssignment.value)?.title
  const res = await axios.get('/EssaySubmissionSearch', { params })
  let list = res.data || []
  // 日期筛选
  if (dateRange.value && (dateRange.value[0] || dateRange.value[1])) {
    const [start, end] = dateRange.value
    list = list.filter((e:any) => {
      const d = e.createdAt?.slice(0,10)
      if (!d) return false
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }
  if (Array.isArray(list) && list.length > 0) {
    essays.value = list
  } else {
    essays.value = [] // 无返回时显示“暂无符合条件的作文”
  }
}

const goToDetail = (id: string) => {
  router.push(`/essay/${id}`)
}

// 提交批阅弹窗相关
const showSubmitDialog = ref(false)
const submitStep = ref(1)
const submitAssignmentOptions = ref<any[]>([])
const submitAssignmentId = ref<string | null>(null)
const submitImages = ref<File[]>([])
const submitColumnCount = ref<number | null>(null)
const submitCounter = ref(0)
const submitTotal = ref(0)

// 步骤切换校验
const canNextStep = computed(() => {
  if (submitStep.value === 1) return !!submitAssignmentId.value
  if (submitStep.value === 2) return submitImages.value && submitImages.value.length > 0 && submitImages.value.length <= 5 && submitColumnCount.value && Number.isInteger(Number(submitColumnCount.value)) && submitColumnCount.value > 0
  return true
})

// 打开弹窗时初始化
const openSubmitDialog = async () => {
  showSubmitDialog.value = true
  submitStep.value = 1
  submitAssignmentId.value = null
  submitImages.value = []
  submitColumnCount.value = null
  submitCounter.value = 0
  submitTotal.value = 0
  // 获取题目列表
  const res = await axios.get('/EssayAssignment')
  submitAssignmentOptions.value = res.data || []
}
const closeSubmitDialog = () => {
  showSubmitDialog.value = false
  // 刷新页面
  fetchEssays()
}

// 步骤按钮
const handleNextStep = async () => {
  if (submitStep.value === 1) {
    submitStep.value = 2
  } else if (submitStep.value === 2) {
    submitStep.value = 3
    submitCounter.value = 0
    submitTotal.value = submitImages.value.length
    await submitAllImages()
  }
}

// 逐张图片提交
const submitAllImages = async () => {
  for (let i = 0; i < submitImages.value.length; i++) {
    const form = new FormData()
    form.append('essayAssignmentId', submitAssignmentId.value!)
    form.append('imageFile', submitImages.value[i])
    form.append('columnCount', String(submitColumnCount.value))
    try {
      await axios.post('/EssaySubmission', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (e) {
      // 可加错误提示
    }
    submitCounter.value++
  }
  submitStep.value = 4
}

// 打开弹窗时自动加载题目
watch(showSubmitDialog, (val) => {
  if (val) openSubmitDialog()
})

onMounted(() => {
  fetchAssignments()
  fetchEssays()
})
</script>

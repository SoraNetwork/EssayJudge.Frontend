<template>
  <v-container>
    <div class="text-h5 mb-4">作文管理</div>
    <!-- 上方筛选窗体 -->
    <v-row class="mb-4" align="center">
      <!-- 时间控件 -->
      <v-col cols="12" md="3">
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
          <v-card>
            <v-date-picker
              v-model="dateRange"
              range
              :max="today"
            />
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" text @click="dateMenu = false">确定</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>
      <!-- 测验控件 -->
      <v-col cols="12" md="3">
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
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="topCount"
          type="number"
          min="1"
          label="最近X篇"
          placeholder="全部"
          clearable
        />
      </v-col>
      <!-- 筛选按钮与其它控件平齐 -->
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn color="primary" @click="fetchEssays" class="ml-auto">筛选</v-btn>
      </v-col>
    </v-row>
    <!-- 下方作文条目列表 -->
    <v-card>
      <v-list>
        <!-- 使用 essays 渲染条目，保持原格式 -->
        <v-list-item
          v-for="essay in essays"
          :key="essay.id"
          class="border-b"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ essay.title || '（无标题）' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              学生：{{ essay.studentName || '未知' }}　时间：{{ essay.createdAt?.slice(0,10) || '未知' }}　分数：{{ essay.finalScore ?? '未评分' }}
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
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
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
// 不再自动关闭菜单，由“确定”按钮控制

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
  let params: any = {}
  if (topCount.value) params.top = topCount.value
  if (selectedAssignment.value) {
    const found = assignmentOptions.value.find(a=>a.id===selectedAssignment.value)
    if (found) params.title = found.title
  }
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
  essays.value = list
}

const goToDetail = (id: string) => {
  router.push(`/essay/${id}`)
}

onMounted(() => {
  fetchAssignments()
  fetchEssays()
})
</script>

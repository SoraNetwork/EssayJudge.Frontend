<template>
  <v-container>
    <!-- 顶部筛选窗体 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              label="搜索测验（标题或GUID）"
              prepend-inner-icon="mdi-magnify"
              dense
              hide-details
              @keyup.enter="fetchAssignments"
              @input="onSearchInput"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="text-right">
            <v-btn color="primary" @click="openDialog">
              <v-icon left>mdi-plus-box</v-icon>
              创建测验
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 测验列表 -->
    <v-card>
      <v-list>
        <v-list-item
          v-for="item in assignments"
          :key="item.id"
          class="align-start"
        >
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle class="mt-2">
              <span class="text-grey">时间：</span>{{ item.time }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn color="primary" variant="tonal" @click="goToDetail(item.id)">
              详细信息
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <div v-if="!assignments.length" class="text-center text-grey mt-4">
          暂无测验
        </div>
      </v-list>
    </v-card>

    <!-- 创建测验弹窗（表单式，一步完成） -->
    <v-dialog v-model="dialog" max-width="600" persistent @keydown.esc="onDialogEsc">
      <v-card>
        <v-card-title>新建测验</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitAssignment">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.baseScore"
                  label="基准分"
                  type="number"
                  min="0"
                  required
                  :rules="[v => v !== null && v !== '' && !isNaN(v) || '请输入基准分']"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.totalScore"
                  label="满分"
                  type="number"
                  min="1"
                  required
                  :rules="[v => v !== null && v !== '' && !isNaN(v) || '请输入满分']"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="form.grade"
                  :items="grades"
                  label="年级"
                  required
                  :rules="[v => !!v || '请选择年级']"
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.titleContext"
                  label="作文题目背景或具体题目"
                  auto-grow
                  rows="3"
                  clearable
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.scoringCriteria"
                  label="作文评分标准"
                  auto-grow
                  rows="3"
                  clearable
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row justify="end">
              <v-col cols="12" class="text-right">
                <v-btn
                  color="primary"
                  :disabled="!canSubmit"
                  type="submit"
                >完成</v-btn>
              </v-col>
            </v-row>
          </v-form>
          <div v-if="showComplete" class="text-center py-8">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
            <div class="text-h6 mt-2 mb-4">完成！</div>
            <v-row justify="center">
              <v-col cols="6">
                <v-btn color="primary" block @click="goToGrading">前往批改作文</v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn color="grey" block @click="closeDialog">关闭</v-btn>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- 关闭确认弹窗 -->
    <v-dialog v-model="closeConfirm" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认关闭</v-card-title>
        <v-card-text>未保存的数据将永久消失（真的很久！）</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeConfirm = false">取消</v-btn>
          <v-btn color="error" @click="forceCloseDialog">确认关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// 设置axios默认后端地址和端口为5000
axios.defaults.baseURL = 'http://localhost:5000'

const router = useRouter()

// 筛选与查询
const search = ref('')
const dialog = ref(false)
const assignments = ref<any[]>([])
const grades = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三'
]

// 创建测验表单
const form = ref({
  baseScore: null as number | null,
  totalScore: null as number | null,
  grade: '',
  titleContext: '',
  scoringCriteria: ''
})

const showComplete = ref(false)

const canSubmit = computed(() => {
  return form.value.baseScore !== null && form.value.totalScore !== null && !isNaN(form.value.baseScore) && !isNaN(form.value.totalScore) && !!form.value.grade
})

const fetchAssignments = async () => {
  try {
    let params: any = {}
    if (search.value) {
      const guidReg = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      if (guidReg.test(search.value.trim())) {
        params.id = search.value.trim()
      } else {
        params.title = search.value.trim()
      }
    }
    const res = await axios.get('/EssayAssignment', { params })
    assignments.value = (res.data || []).map((a: any) => ({
      id: a.id,
      title: a.titleContext || a.title || '无标题',
      time: a.createTime ? a.createTime.slice(0, 10) : ''
    }))
  } catch (e) {
    assignments.value = []
  }
}

const onSearchInput = () => {
  fetchAssignments()
}

onMounted(fetchAssignments)

const submitAssignment = async () => {
  if (!canSubmit.value) return
  showComplete.value = true
  try {
    await axios.post('/EssayAssignment',
      new URLSearchParams({
        grade: form.value.grade,
        totalScore: String(form.value.totalScore),
        baseScore: String(form.value.baseScore),
        titleContext: form.value.titleContext ?? '',
        scoringCriteria: form.value.scoringCriteria ?? ''
      })
    )
    fetchAssignments()
  } catch (e) {
    // 可加错误提示
  }
}

const closeDialog = () => {
  dialog.value = false
  showComplete.value = false
  form.value = {
    baseScore: null,
    totalScore: null,
    grade: '',
    titleContext: '',
    scoringCriteria: ''
  }
}

const openDialog = () => {
  dialog.value = true
  showComplete.value = false
  form.value = {
    baseScore: null,
    totalScore: null,
    grade: '',
    titleContext: '',
    scoringCriteria: ''
  }
}

const goToDetail = (id: string) => {
  router.push(`/assignment/${id}`)
}

const goToGrading = () => {
  router.push('/essay')
}

const closeConfirm = ref(false)

const onDialogEsc = (e: KeyboardEvent) => {
  e.preventDefault()
  closeConfirm.value = true
}

const forceCloseDialog = () => {
  closeConfirm.value = false
  closeDialog()
}
</script>

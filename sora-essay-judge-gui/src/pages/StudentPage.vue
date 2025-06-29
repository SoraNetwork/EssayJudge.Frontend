<template>
  <v-container>
    <!-- 顶部搜索与创建 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="搜索学生姓名"
              prepend-inner-icon="mdi-magnify"
              dense
              hide-details
              @keyup.enter="fetchStudents"
              @input="onSearchInput"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchClassId"
              label="班级ID"
              prepend-inner-icon="mdi-account-group"
              dense
              hide-details
              @keyup.enter="fetchStudents"
              @input="onSearchInput"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="text-right">
            <v-btn color="primary" @click="showCreate = true">
              <v-icon left>mdi-plus-box</v-icon>
              创建学生
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 学生列表 -->
    <v-card>
      <v-list>
        <v-list-item
          v-for="stu in students"
          :key="stu.id"
        >
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">{{ stu.name }}</v-list-item-title>
          </v-list-item-content>
          <div class="flex-1"></div>
          <div class="flex items-center justify-end w-32">
            <v-btn color="primary" variant="tonal" @click="openSummaryDialog(stu)">
              获取摘要
            </v-btn>
          </div>
        </v-list-item>
        <div v-if="!students.length" class="text-center text-grey mt-4">
          暂无学生
        </div>
      </v-list>
    </v-card>

    <!-- 创建学生弹窗 -->
    <v-dialog v-model="showCreate" max-width="400" persistent @keydown.esc="onCreateEsc">
      <v-card>
        <v-card-title>创建学生</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="name"
            label="学生姓名"
            autofocus
            required
          ></v-text-field>
          <v-text-field
            v-model="studentId"
            label="学号"
            maxlength="8"
            counter
            required
          ></v-text-field>
          <v-text-field
            v-model="classId"
            label="班级ID"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!canCreateStudent"
            @click="createStudent"
          >完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 创建学生关闭确认 -->
    <v-dialog v-model="showCreateCloseConfirm" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认关闭</v-card-title>
        <v-card-text>未保存的数据将永久消失（真的很久！）</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showCreateCloseConfirm = false">取消</v-btn>
          <v-btn color="error" @click="forceCloseCreate">确认关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 获取摘要弹窗 -->
    <v-dialog v-model="showSummary" max-width="400" persistent @keydown.esc="onSummaryEsc">
      <v-card>
        <v-card-title>获取摘要</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="summaryTop"
            label="条数"
            type="number"
            min="1"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!summaryTop"
            @click="fetchSummary"
          >完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 获取摘要关闭确认 -->
    <v-dialog v-model="showSummaryCloseConfirm" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认关闭</v-card-title>
        <v-card-text>未保存的数据将永久消失（真的很久！）</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showSummaryCloseConfirm = false">取消</v-btn>
          <v-btn color="error" @click="forceCloseSummary">确认关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 摘要结果弹窗 -->
    <v-dialog v-model="showSummaryResult" max-width="600">
      <v-card>
        <v-card-title>摘要结果</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="item in summaryResult"
              :key="item.id"
            >
              <v-list-item-content>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  分数：{{ item.suggestedScore ?? '--' }}，时间：{{ item.time ?? '--' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div v-if="!summaryResult.length" class="text-center text-grey mt-2">
              暂无摘要
            </div>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showSummaryResult = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:5000'

// 搜索与学生列表
const search = ref('')
const searchClassId = ref('')
const students = ref<any[]>([])
const name = ref('')
const studentId = ref('')
const classId = ref('')
const showCreate = ref(false)
const showCreateCloseConfirm = ref(false)
const showSummary = ref(false)
const showSummaryCloseConfirm = ref(false)
const showSummaryResult = ref(false)
const summaryTop = ref<number | null>(null)
const summaryResult = ref<any[]>([])
const summaryStudent = ref<any>(null)

const fetchStudents = async () => {
  try {
    let params: any = {}
    if (search.value) {
      params.name = search.value.trim()
    }
    if (searchClassId.value) {
      params.classId = searchClassId.value.trim()
    }
    // 查询所有学生信息，使用 /Student 路由
    const res = await axios.get('/Student', { params })
    students.value = res.data || []
  } catch {
    students.value = []
  }
}

const onSearchInput = () => {
  fetchStudents()
}

onMounted(fetchStudents)
watch(search, fetchStudents)
watch(searchClassId, fetchStudents)

const canCreateStudent = computed(() => {
  // 简单校验：姓名非空，学号8位数字，classId非空
  return !!name.value && /^\d{8}$/.test(studentId.value) && !!classId.value
})

const createStudent = async () => {
  try {
    await axios.post('/Student',
      new URLSearchParams({
        name: name.value,
        studentId: studentId.value,
        classId: classId.value
      })
    )
    showCreate.value = false
    name.value = ''
    studentId.value = ''
    classId.value = ''
    fetchStudents()
  } catch {
    // 可加错误提示
  }
}

const onCreateEsc = (e: KeyboardEvent) => {
  e.preventDefault()
  showCreateCloseConfirm.value = true
}
const forceCloseCreate = () => {
  showCreateCloseConfirm.value = false
  showCreate.value = false
  name.value = ''
  studentId.value = ''
  classId.value = ''
}

const openSummaryDialog = (stu: any) => {
  summaryStudent.value = stu
  summaryTop.value = null
  showSummary.value = true
}
const onSummaryEsc = (e: KeyboardEvent) => {
  e.preventDefault()
  showSummaryCloseConfirm.value = true
}
const forceCloseSummary = () => {
  showSummaryCloseConfirm.value = false
  showSummary.value = false
  summaryTop.value = null
}

const fetchSummary = async () => {
  if (!summaryStudent.value || !summaryTop.value) return
  try {
    let params: any = { top: summaryTop.value }
    if (summaryStudent.value.id) params.studentId = summaryStudent.value.id
    else params.studentName = summaryStudent.value.name
    const res = await axios.get('/EssaySubmission/summary', { params })
    summaryResult.value = res.data || []
  } catch {
    summaryResult.value = []
  }
  showSummary.value = false
  showSummaryResult.value = true
}

const closeDialog = () => {
  showCreate.value = false
  showCreateCloseConfirm.value = false
  name.value = ''
  studentId.value = ''
  classId.value = ''
}

const openDialog = () => {
  showCreate.value = true
  name.value = ''
  studentId.value = ''
  classId.value = ''
}
</script>

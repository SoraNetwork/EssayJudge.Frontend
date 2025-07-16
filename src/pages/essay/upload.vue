<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">学生作文提交</h2>
      </v-col>

      <v-col cols="12">
        <v-stepper v-model="currentStep">
          <v-stepper-header>
            <v-stepper-item step="1">
              学生信息
            </v-stepper-item>

            <v-stepper-divider></v-stepper-divider>

            <v-stepper-item step="2">
              作文提交
            </v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- 第一步：学生信息 -->
            <v-stepper-window-item step="1">
              <v-card>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="selectedClass"
                        :items="classes"
                        item-title="name"
                        item-value="id"
                        label="选择班级"
                        :loading="loadingClasses"
                        :error-messages="classError"
                        persistent-hint
                        hint="请先选择班级"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="selectedStudent"
                        :items="filteredStudents"
                        item-title="name"
                        item-value="studentId"
                        label="选择学生"
                        :loading="loadingStudents"
                        :disabled="!selectedClass"
                        :error-messages="studentError"
                        persistent-hint
                        hint="选择学生后将自动填充学号"
                      >
                        <template v-slot:item="{ item }">
                          <v-list-item-title>
                            {{ (item as StudentSelectItem).raw.name }} ({{ (item as StudentSelectItem).raw.studentId }})
                          </v-list-item-title>
                        </template>
                      </v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="studentId"
                        label="学号验证（8位）"
                        :rules="studentIdRules"
                        :error-messages="studentIdError"
                        readonly
                        persistent-hint
                        hint="学号将根据选择的学生自动填充"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-spacer/>
                  <v-btn
                    color="primary"
                    :disabled="!isStep1Valid"
                    @click="validateStudentAndProceed"
                    :loading="validatingStudent"
                  >
                    下一步
                    <v-icon icon="mdi-chevron-right" end></v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-window-item>

            <!-- 第二步：作业选择和图片上传 -->
            <v-stepper-window-item step="2">
              <v-card>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="selectedAssignment"
                        :items="assignments"
                        item-title="description"
                        item-value="id"
                        label="选择作业"
                        :loading="loadingAssignments"
                        :error-messages="assignmentError"
                      >
                        <template v-slot:item="{ item }">
                          <v-list-item-title>{{ (item as AssignmentSelectItem).raw.description || '未命名作业' }}</v-list-item-title>
                          <v-list-item-subtitle>
                            总分: {{ (item as AssignmentSelectItem).raw.totalScore }} | 年级: {{ (item as AssignmentSelectItem).raw.grade }}
                          </v-list-item-subtitle>
                        </template>
                      </v-select>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="columnCount"
                        type="number"
                        label="分栏数"
                        min="1"
                        max="4"
                        :rules="[v => !!v || '请输入分栏数', v => v > 0 && v <= 4 || '分栏数必须在1-4之间']"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-file-input
                        v-model="imageFile"
                        label="上传作文图片"
                        accept="image/*"
                        prepend-icon="mdi-camera"
                        :error-messages="imageError"
                        show-size
                        @change="handleImageSelected"
                      >
                        <template v-slot:selection="{ fileNames }">
                          <template v-for="fileName in fileNames" :key="fileName">
                            <v-chip
                              size="small"
                              label
                              color="primary"
                              class="me-2"
                            >
                              {{ fileName }}
                            </v-chip>
                          </template>
                        </template>
                      </v-file-input>
                    </v-col>

                    <v-col cols="12" v-if="processedImageUrl">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          图片预览
                          <v-chip
                            color="success"
                            size="small"
                            class="ml-2"
                          >
                            已处理
                          </v-chip>
                        </v-card-title>
                        <v-card-text>
                          <v-img
                            :src="`/essayfiles/${processedImageUrl}`"
                            max-height="500"
                            contain
                            class="mx-auto"
                          />
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-btn 
                    @click="currentStep = 1"
                    prepend-icon="mdi-chevron-left"
                  >
                    返回
                  </v-btn>
                  <v-spacer/>
                  <v-btn
                    color="primary"
                    :disabled="!isStep2Valid"
                    :loading="submitting"
                    @click="submitEssay"
                  >
                    提交作文
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5">提交成功</v-card-title>
        <v-card-text>
          作文已成功提交，我们会尽快进行批改。
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn
            color="primary"
            @click="resetForm"
          >
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 错误提示 -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="3000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showError = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axiosInstance'

// 类型定义
interface Student {
  id: string
  studentId: string
  name: string
}

interface Class {
  id: string
  name: string
  createdAt: string
  students: Student[]
}

interface Assignment {
  id: string
  grade: string
  description: string
  totalScore: number
  baseScore: number
  titleContext?: string
  scoringCriteria?: string
  createdAt: string
}

// 为Student和Assignment分别定义SelectItem类型
interface StudentSelectItem {
  raw: Student
  value: string
  title: string
}

interface AssignmentSelectItem {
  raw: Assignment
  value: string
  title: string
}

const router = useRouter()

// 错误处理
const showError = ref(false)
const errorMessage = ref('')

// 表单步骤
const currentStep = ref(1)

// 学生信息相关
const classes = ref<Class[]>([])
const selectedClass = ref('')
const selectedStudent = ref('')
const studentId = ref('')
const loadingClasses = ref(false)
const loadingStudents = ref(false)
const validatingStudent = ref(false)
const classError = ref('')
const studentError = ref('')
const studentIdError = ref('')

// 学号验证规则
const studentIdRules = [
  (v: string) => !!v || '请输入学号',
  (v: string) => v.length === 8 || '学号必须是8位'
]

// 根据选择的班级过滤学生列表
const filteredStudents = computed<Student[]>(() => {
  if (!selectedClass.value) return []
  const classData = classes.value.find(c => c.id === selectedClass.value)
  return classData?.students || []
})

// 作业相关
const assignments = ref<Assignment[]>([])
const selectedAssignment = ref('')
const loadingAssignments = ref(false)
const assignmentError = ref('')
const columnCount = ref(1)

// 图片相关
const imageFile = ref<File | null>(null)
const processedImageUrl = ref('')
const imageError = ref('')
const submitting = ref(false)
const showSuccessDialog = ref(false)

// 表单验证
const isStep1Valid = computed(() => {
  return selectedClass.value && 
         selectedStudent.value && 
         studentId.value.length === 8 &&
         filteredStudents.value.some(s => s.studentId === studentId.value)
})

const isStep2Valid = computed(() => {
  return selectedAssignment.value && 
         processedImageUrl.value &&
         columnCount.value >= 1 &&
         columnCount.value <= 4 &&
         typeof columnCount.value === 'number' &&
         Number.isInteger(columnCount.value)
})

// 显示错误消息
function showErrorMessage(message: string) {
  errorMessage.value = message
  showError.value = true
}

// 获取班级列表
async function fetchClasses() {
  try {
    loadingClasses.value = true
    classError.value = ''
    const response = await axios.get('/essay/studentupload/studentinfo')
    if (response.data && Array.isArray(response.data)) {
      classes.value = response.data
    } else {
      throw new Error('获取班级数据格式错误')
    }
  } catch (error: any) {
    classError.value = '获取班级列表失败'
    showErrorMessage(error.response?.data?.message || '获取班级列表失败')
  } finally {
    loadingClasses.value = false
  }
}

// 获取作业列表
async function fetchAssignments(studentId: string) {
  try {
    loadingAssignments.value = true
    assignmentError.value = ''
    const response = await axios.get(`/essay/studentupload/assignments/${studentId}`)
    if (response.data && Array.isArray(response.data)) {
      assignments.value = response.data
      if (assignments.value.length === 0) {
        assignmentError.value = '当前没有可提交的作业'
      }
    } else {
      throw new Error('获取作业数据格式错误')
    }
  } catch (error: any) {
    assignmentError.value = '获取作业列表失败'
    showErrorMessage(error.response?.data?.message || '获取作业列表失败')
  } finally {
    loadingAssignments.value = false
  }
}

// 验证学生信息并进入下一步
async function validateStudentAndProceed() {
  try {
    validatingStudent.value = true
    studentIdError.value = ''
    
    // 验证学号是否匹配
    const student = filteredStudents.value.find(s => s.studentId === studentId.value)
    if (!student || student.studentId !== selectedStudent.value) {
      studentIdError.value = '学号与选择的学生不匹配'
      return
    }

    // 获取该学生可提交的作业
    await fetchAssignments(studentId.value)
    
    if (!assignmentError.value && assignments.value.length > 0) {
      // 进入下一步
      currentStep.value = 2
    } else if (assignments.value.length === 0) {
      showErrorMessage('该学生当前没有可提交的作业')
    }
  } catch (error: any) {
    studentIdError.value = '验证学生信息失败'
    showErrorMessage(error.message || '验证学生信息失败')
  } finally {
    validatingStudent.value = false
  }
}

// 处理图片选择
async function handleImageSelected(file: File | null) {
  if (!file) {
    imageError.value = '请选择图片'
    processedImageUrl.value = ''
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/essay/studentupload/checkimg', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data?.success && response.data?.processedImageUrl) {
      processedImageUrl.value = response.data.processedImageUrl
      imageError.value = ''
    } else {
      throw new Error(response.data?.message || '图片处理失败')
    }
  } catch (error: any) {
    imageError.value = '图片处理失败'
    processedImageUrl.value = ''
    showErrorMessage(error.response?.data?.message || error.message || '图片处理失败')
  }
}

// 提交作文
async function submitEssay() {
  if (!isStep2Valid.value) {
    showErrorMessage('请完整填写所有必要信息')
    return
  }

  try {
    submitting.value = true
    const submission = {
      studentId: studentId.value,
      essayAssignmentId: selectedAssignment.value,
      processedImageUrl: processedImageUrl.value,
      columnCount: Number(columnCount.value)
    }

    await axios.post('/essay/studentupload/submit', submission)
    showSuccessDialog.value = true
  } catch (error: any) {
    console.error('提交作文失败:', error)
    showErrorMessage(error.response?.data?.message || '提交作文失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
function resetForm() {
  currentStep.value = 1
  selectedClass.value = ''
  selectedStudent.value = ''
  studentId.value = ''
  selectedAssignment.value = ''
  columnCount.value = 1
  imageFile.value = null
  processedImageUrl.value = ''
  showSuccessDialog.value = false
  showError.value = false
  errorMessage.value = ''
  
  // 清空错误信息
  classError.value = ''
  studentError.value = ''
  studentIdError.value = ''
  assignmentError.value = ''
  imageError.value = ''

  // 重新获取班级列表
  fetchClasses()
}

// 页面加载时获取班级列表
fetchClasses()

// 监听班级选择变化
watch(selectedClass, (newClassId) => {
  selectedStudent.value = ''
  studentId.value = ''
  studentError.value = ''
  studentIdError.value = ''
})

// 监听学生选择变化
watch(selectedStudent, (newStudentId) => {
  if (newStudentId) {
    const student = filteredStudents.value.find(s => s.studentId === newStudentId)
    if (student) {
      studentId.value = student.studentId
      studentError.value = ''
      studentIdError.value = ''
    }
  } else {
    studentId.value = ''
  }
})

// 监听分栏数变化，确保是整数
watch(columnCount, (newValue) => {
  if (typeof newValue === 'string') {
    columnCount.value = parseInt(newValue) || 1
  }
  if (columnCount.value < 1) columnCount.value = 1
  if (columnCount.value > 4) columnCount.value = 4
})
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}
</style>

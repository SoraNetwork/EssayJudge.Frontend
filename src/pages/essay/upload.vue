<template>
  <div>
    <h1 class="text-h4 mb-4">学生作文提交</h1>

    <v-card>
      <v-card-text>
        <v-form @submit.prevent="submitEssay">
          <!-- 提交方式选择 -->
          <v-btn-toggle v-model="submitMode" mandatory class="mb-4">
            <v-btn value="image">图片上传</v-btn>
            <v-btn value="text">文字输入</v-btn>
          </v-btn-toggle>

          <v-row class="mb-4">
            <!-- 班级选择 -->
            <v-col cols="12" sm="6" class="px-sm-2">
              <v-select v-model="selectedClass" :items="classes" item-title="name" item-value="id" label="选择班级"
                :loading="loadingClasses" :error-messages="classError" class="mb-4" />
            </v-col>
            <v-col cols="12" sm="6" class="px-sm-2">
              <!-- 学生选择 -->
              <v-select v-model="selectedStudent" :items="filteredStudents" item-title="name" item-value="studentId"
                label="选择学生" :loading="loadingStudents" :error-messages="studentError" :disabled="!selectedClass"
                persistent-hint hint="选择学生后将自动填充学号" class="mb-4" @update:model-value="onStudentSelected">
                <template v-slot:selection="{ item }">
                  <span>{{ item.raw.name }} ({{ item.raw.studentId }})</span>
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>学号: {{ item.raw.studentId }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            <!-- 学号显示 -->
            <v-col cols="12" sm="6" class="px-sm-2">
              <v-text-field v-model="studentId" label="学号" :error-messages="studentIdError" class="mb-4" 
                @update:model-value="onStudentIdInput" :loading="validatingStudent"/>
            </v-col>
            <v-select v-model="selectedAssignment" :items="assignments" item-title="description" item-value="id"
              label="选择作业" :loading="loadingAssignments" :error-messages="assignmentError" :disabled="!selectedStudent"
              persistent-hint hint="选择要提交的作业" class="mb-4">
              <template v-slot:selection="{ item }">
                <span>{{ item.raw.description || '请选择作业' }}</span>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{ item.raw.description || '请选择作业' }}</v-list-item-title>
                  <v-list-item-subtitle>创建时间: {{ formatDate(item.raw.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>

          </v-row>
          <!-- 作业选择 -->

          <!-- 分栏数 (仅图片模式) -->
          <v-text-field v-if="submitMode === 'image'" v-model.number="columnCount" type="number" label="分栏数" min="1"
            max="4" :rules="columnRules" class="mb-4" />

          <!-- 图片上传模式 -->
          <div v-if="submitMode === 'image'">
            <!-- 图片上传 -->
            <v-file-input v-model="imageFiles" label="上传作文图片" accept="image/*" :error-messages="imageError" show-size
              multiple @change="handleImagesSelected" class="mb-4" />

            <!-- 图片预览 -->
            <v-card v-if="processedImageUrl" variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1">
                图片预览
                <v-chip color="success" size="small" class="ml-2">已处理</v-chip>
              </v-card-title>
              <v-card-text>
                <v-img :src="fullProcessedImageUrl" max-height="500" contain class="mx-auto cursor-pointer"
                  @click="showImageDialog = true" />
              </v-card-text>
            </v-card>
          </div>

          <!-- 文字输入模式 -->
          <div v-else>
            <v-textarea v-model="essayText" label="输入作文内容" :rules="textRules" rows="10" clearable class="mb-4" />
          </div>

          <!-- 提交按钮 -->
          <div class="d-flex justify-end">
            <v-btn color="secondary" class="mr-4" @click="navigateToQuery">
              查询作文
            </v-btn>
            <v-btn type="submit" color="primary" :loading="submitting" :disabled="!isFormValid">
              提交作文
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- 成功提示 -->
    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5">作文提交成功</v-card-title>
        <v-card-text>
          <p>您的作文查询ID为:</p>
          <div class="copy-container text-h6 text-center my-2" @click="copyToClipboard(submittedEssayShortId)">
            <strong>{{ submittedEssayShortId }}</strong>
            <div class="copy-overlay">
              <span v-if="!isCopied">点击复制</span>
              <span v-else>已复制!</span>
            </div>
          </div>
          <p class="text-caption">您可以使用此ID在查询页面跟踪作文状态。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="goToQueryPage">前往查询</v-btn>
          <v-btn color="primary" @click="confirmAndReload">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 图片放大显示 -->
    <v-dialog v-model="showImageDialog" max-width="90vw">
      <v-card>
        <v-card-text class="pa-0">
          <v-img :src="fullProcessedImageUrl" contain />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showImageDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 错误提示 -->
    <v-snackbar v-model="showError" color="error" timeout="3000">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showError = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getStudentInfoForUpload, 
  getAssignmentsForStudent, 
  checkEssayImage,
  submitEssayWithImage,
  submitEssayWithText,
  type ClassWithStudents as Class, 
  type Student as Student, 
  type Assignment 
} from '@/services/apiService'
import  api  from '@/services/api'

// 类型定义 (现在可以从 apiService 导入)
// interface Student {
//   id: string
//   studentId: string
//   name: string
// }

// interface Class {
//   id: string
//   name: string
//   createdAt: string
//   students: Student[]
// }

// interface Assignment {
//   id: string
//   grade: string
//   description: string
//   totalScore: number
//   baseScore: number
//   titleContext?: string
//   scoringCriteria?: string
//   createdAt: string
// }

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

function navigateToQuery() {
  router.push('/essay/query')
}

// 错误处理
const showError = ref(false)
const errorMessage = ref('')

// 提交方式
const submitMode = ref<'image' | 'text'>('image')

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
// 修改: 将单个文件改为文件数组
const imageFiles = ref<File[]>([])
const processedImageUrl = ref('')
const imageError = ref('')

// 根据 processedImageUrl 计算完整的 URL
const fullProcessedImageUrl = computed(() => {
  if (!processedImageUrl.value) return ''
  // 如果已经是完整的 URL，则直接使用
  if (processedImageUrl.value.startsWith('http')) {
    return processedImageUrl.value
  }
  // 否则，与 axios 的 baseURL 拼接
  const baseURL = api.defaults.baseURL || ''
  // 确保 baseURL 和路径之间只有一个斜杠
  return `${baseURL.replace(/\/$/, '')}/${processedImageUrl.value.replace(/^\//, '')}`
})

// 文字相关
const essayText = ref('')

// 提交状态
const submitting = ref(false)
const showSuccessDialog = ref(false)
const showImageDialog = ref(false)
const submittedEssayShortId = ref('')
const isCopied = ref(false)

// 当前步骤
const currentStep = ref(1)

// 日期格式化
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const date = new Date(dateString);
  date.setHours(date.getHours() + 8); // UTC+8
  return date.toLocaleString(undefined, options);
}

// 分栏数验证规则
const columnRules = [
  (v: number) => !!v || '请输入分栏数',
  (v: number) => v >= 1 && v <= 4 || '分栏数必须在1-4之间'
]

// 文字验证规则
const textRules = [
  (v: string) => !!v || '请输入作文内容',
  (v: string) => v.length >= 10 || '作文内容至少需要10个字符'
]

// 表单验证
const isFormValid = computed(() => {
  if (submitMode.value === 'image') {
    return selectedClass.value &&
           selectedStudent.value &&
           studentId.value &&
           selectedAssignment.value &&
           processedImageUrl.value &&
           columnCount.value >= 1 &&
           columnCount.value <= 4
  } else {
    return selectedClass.value &&
           selectedStudent.value &&
           studentId.value &&
           selectedAssignment.value &&
           essayText.value &&
           essayText.value.length >= 10
  }
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
    const response = await getStudentInfoForUpload()
    if (response && Array.isArray(response)) {
      classes.value = response
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
    const response = await getAssignmentsForStudent(studentId)
    if (response && Array.isArray(response)) {
      assignments.value = response
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

// 验证学生信息并获取作业
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
  } catch (error: any) {
    studentIdError.value = '验证学生信息失败'
    showErrorMessage(error.message || '验证学生信息失败')
  } finally {
    validatingStudent.value = false
  }
}

// 处理图片选择
// 修改: 更新处理函数以处理多个文件
async function handleImagesSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) {
    imageError.value = '请选择图片'
    processedImageUrl.value = ''
    return
  }

  // 更新文件数组
  imageFiles.value = Array.from(files)

  try {
    // 调用更新后的API处理多个文件
    const response = await checkEssayImage(files)

    if (response?.success && response?.processedImageUrl) {
      processedImageUrl.value = response.processedImageUrl
      imageError.value = ''
    } else {
      throw new Error(response?.message || '图片处理失败')
    }
  } catch (error: any) {
    imageError.value = error.message || '图片处理失败'
    processedImageUrl.value = ''
    showErrorMessage(error.response?.data?.message || error.message || '图片处理失败')
  }
}

// 提交作文
async function submitEssay() {
  if (!isFormValid.value) {
    showErrorMessage('请完整填写所有必要信息')
    return
  }

  try {
    submitting.value = true
    
    if (submitMode.value === 'image') {
      // 图片模式提交
      const response = await submitEssayWithImage({
        studentId: studentId.value,
        essayAssignmentId: selectedAssignment.value,
        processedImageUrl: processedImageUrl.value,
        columnCount: Math.floor(Number(columnCount.value))
      })
      
      if (response?.id) {
        submittedEssayShortId.value = response.id.slice(-8).toUpperCase()
        showSuccessDialog.value = true
      } else {
        throw new Error('提交失败')
      }
    } else {
      // 文字模式提交
      const response = await submitEssayWithText({
        studentId: studentId.value,
        essayAssignmentId: selectedAssignment.value,
        prasedText: essayText.value
      })
      
      if (response?.id) {
        submittedEssayShortId.value = response.id.slice(-8).toUpperCase()
        showSuccessDialog.value = true
      } else {
        throw new Error('提交失败')
      }
    }
  } catch (error: any) {
    console.error('提交作文失败:', error)
    showErrorMessage(error.response?.data?.message || '提交作文失败')
  } finally {
    submitting.value = false
  }
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败: ', err)
    showErrorMessage('复制ID失败')
  }
}

// 前往查询页面
function goToQueryPage() {
  const shortId = submittedEssayShortId.value
  resetForm()
  router.push({ path: '/essay/query', query: { id: shortId } })
}

// 确认并刷新页面
function confirmAndReload() {
  showSuccessDialog.value = false
  window.location.reload()
}

// 重置表单
function resetForm() {
  currentStep.value = 1
  selectedClass.value = ''
  selectedStudent.value = ''
  studentId.value = ''
  selectedAssignment.value = ''
  columnCount.value = 1
  // 修改: 重置文件数组
  imageFiles.value = []
  processedImageUrl.value = ''
  essayText.value = ''
  submittedEssayShortId.value = ''
  isCopied.value = false
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
watch(selectedStudent, async (newStudentId) => {
  if (newStudentId) {
    const student = filteredStudents.value.find(s => s.studentId === newStudentId)
    if (student) {
      studentId.value = student.studentId
      studentError.value = ''
      studentIdError.value = ''
      // 当选择新学生时，自动获取该学生的作业列表
      await fetchAssignments(student.studentId)
    }
  } else {
    studentId.value = ''
    // 清空作业列表
    assignments.value = []
    selectedAssignment.value = ''
  }
})

// 新增：当选择学生时自动填充学号
function onStudentSelected(studentId: string) {
  if (studentId) {
    const student = filteredStudents.value.find(s => s.studentId === studentId)
    if (student) {
      selectedStudent.value = student.studentId
      studentId = student.studentId
    }
  }
}

// 新增：当输入学号时自动选择对应的学生
function onStudentIdInput(inputStudentId: string) {
  if (inputStudentId) {
    const student = filteredStudents.value.find(s => s.studentId === inputStudentId)
    if (student) {
      selectedStudent.value = student.studentId
      studentId.value = student.studentId
      studentIdError.value = ''
    } else if (inputStudentId.length === 8) {
      // 如果输入了8位学号但找不到对应学生，显示错误
      studentIdError.value = '未找到该学号对应的学生'
    } else if (inputStudentId.length > 8) {
      studentIdError.value = '学号必须是8位'
    } else {
      studentIdError.value = ''
    }
  } else {
    selectedStudent.value = ''
    studentIdError.value = ''
  }
}

// 监听分栏数变化，确保是整数
watch(columnCount, (newValue) => {
  if (typeof newValue === 'string') {
    columnCount.value = parseInt(newValue) || 1
  }
  if (columnCount.value < 1) columnCount.value = 1
  if (columnCount.value > 4) columnCount.value = 4
})

// 监听提交模式变化，重置相关字段
watch(submitMode, () => {
  // 修改: 重置文件数组
  imageFiles.value = []
  processedImageUrl.value = ''
  essayText.value = ''
  imageError.value = ''
})
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}

.copy-container {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.copy-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 4px;
  font-size: 1rem;
}

.copy-container:hover .copy-overlay {
  opacity: 1;
}
</style>
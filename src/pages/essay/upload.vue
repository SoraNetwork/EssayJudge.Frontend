<template>
  <div class="upload-container">
    <h1 class="page-title">学生作文提交</h1>

    <a-card>
      <a-form @finish="submitEssay" layout="vertical">
        <!-- 提交方式选择 -->
        <a-form-item label="提交方式">
          <a-radio-group v-model:value="submitMode" button-style="solid">
            <a-radio-button value="image">图片上传</a-radio-button>
            <a-radio-button value="text">文字输入</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <a-row :gutter="[16, 16]">
          <!-- 班级选择 -->
          <a-col :xs="24" :sm="12">
            <a-form-item
              label="选择班级"
              :validate-status="classError ? 'error' : ''"
              :help="classError"
            >
              <a-select
                v-model:value="selectedClass"
                placeholder="请选择班级"
                :options="classOptions"
                :loading="loadingClasses"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <!-- 学生选择 -->
          <a-col :xs="24" :sm="12">
            <a-form-item
              label="选择学生"
              :validate-status="studentError ? 'error' : ''"
              :help="studentError"
            >
              <a-select
                v-model:value="selectedStudent"
                placeholder="请选择学生"
                :options="studentOptions"
                :loading="loadingStudents"
                :disabled="!selectedClass"
                allow-clear
                show-search
                :filter-option="filterStudentOption"
                @change="onStudentSelected"
              >
                <template #option="{ name, studentId }">
                  <div>{{ name }}</div>
                  <div style="font-size: 12px; color: #999;">学号: {{ studentId }}</div>
                </template>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 学号显示 -->
          <a-col :xs="24" :sm="12">
            <a-form-item
              label="学号"
              :validate-status="studentIdError ? 'error' : ''"
              :help="studentIdError"
            >
              <a-input
                v-model:value="studentId"
                placeholder="请输入学号"
                :loading="validatingStudent"
                @input="onStudentIdInput"
                maxlength="8"
              />
            </a-form-item>
          </a-col>

          <!-- 作业选择 -->
          <a-col :xs="24" :sm="12">
            <a-form-item
              label="选择作业"
              :validate-status="assignmentError ? 'error' : ''"
              :help="assignmentError"
            >
              <a-select
                v-model:value="selectedAssignment"
                placeholder="请选择作业"
                :options="assignmentOptions"
                :loading="loadingAssignments"
                :disabled="!selectedStudent"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 分栏数 (仅图片模式) -->
        <a-form-item v-if="submitMode === 'image'" label="分栏数">
          <a-input-number
            v-model:value="columnCount"
            :min="1"
            :max="4"
            style="width: 100%"
          />
        </a-form-item>

        <!-- 图片上传模式 -->
        <div v-if="submitMode === 'image'">
          <a-form-item
            label="上传作文图片"
            :validate-status="imageError ? 'error' : ''"
            :help="imageError"
          >
            <a-upload
              :file-list="imageFileList"
              :before-upload="handleImageSelected"
              @remove="handleImageRemove"
              accept="image/*"
              list-type="picture-card"
              :max-count="1"
            >
              <div v-if="imageFileList.length === 0">
                <PlusOutlined />
                <div style="margin-top: 8px">上传图片</div>
              </div>
            </a-upload>
          </a-form-item>
          <!-- 图片上传模式 -->
          <div v-if="submitMode === 'image'">
            <!-- 图片上传 -->
            <v-file-input
             v-model="imageFile" 
             label="上传作文图片" 
             accept="image/*" 
             :error-messages="imageError" 
             show-size
             multiple
             @change="handleImageSelected" 
             class="mb-4" />
          </div>
          <!-- 图片预览 -->
          <a-card v-if="processedImageUrl" class="mb-4">
            <template #title>
              <span>图片预览</span>
              <a-tag color="success" style="margin-left: 8px;">已处理</a-tag>
            </template>
            <div class="image-preview">
              <a-image
                :src="fullProcessedImageUrl"
                :preview="{ visible: showImageDialog, onVisibleChange: (vis: boolean) => showImageDialog = vis }"
                style="max-height: 500px; cursor: pointer;"
              />
            </div>
          </a-card>
        </div>

        <!-- 文字输入模式 -->
        <div v-else>
          <a-form-item
            label="输入作文内容"
            :rules="textRules"
          >
            <a-textarea
              v-model:value="essayText"
              placeholder="请输入作文内容"
              :rows="10"
              show-count
              :maxlength="10000"
            />
          </a-form-item>
        </div>

        <!-- 提交按钮 -->
        <a-form-item>
          <a-space>
            <a-button @click="navigateToQuery">
              查询作文
            </a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="submitting"
              :disabled="!isFormValid"
            >
              提交作文
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 成功提示 -->
    <a-modal
      v-model:open="showSuccessDialog"
      title="作文提交成功"
      :footer="null"
      width="400px"
    >
      <p>您的作文查询ID为:</p>
      <div class="copy-container" @click="copyToClipboard(submittedEssayShortId)">
        <a-typography-title :level="4" class="short-id">{{ submittedEssayShortId }}</a-typography-title>
        <div class="copy-overlay">
          <span v-if="!isCopied">点击复制</span>
          <span v-else>已复制!</span>
        </div>
      </div>
      <p class="text-caption">您可以使用此ID在查询页面跟踪作文状态。</p>
      <div class="modal-footer">
        <a-space>
          <a-button @click="goToQueryPage">前往查询</a-button>
          <a-button type="primary" @click="confirmAndReload">确定</a-button>
        </a-space>
      </div>
    </a-modal>

    <!-- 错误提示 -->
    <a-message v-model:visible="showError" type="error">
      {{ errorMessage }}
    </a-message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'
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
import api from '@/services/api'
import { message } from 'ant-design-vue'

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

const classOptions = computed(() => {
  return classes.value.map(item => ({
    label: item.name,
    value: item.id
  }))
})

const studentOptions = computed(() => {
  return filteredStudents.value.map(item => ({
    label: item.name,
    value: item.studentId,
    name: item.name,
    studentId: item.studentId
  }))
})

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

const assignmentOptions = computed(() => {
  return assignments.value.map(item => ({
    label: item.description || item.titleContext || '请选择作业',
    value: item.id,
    createdAt: item.createdAt
  }))
})

// 图片相关
const imageFile = ref<File | null>(null)
const imageFileList = ref<UploadFile[]>([])
const processedImageUrl = ref('')
const imageError = ref('')
const showImageDialog = ref(false)

const fullProcessedImageUrl = computed(() => {
  if (!processedImageUrl.value) return ''
  if (processedImageUrl.value.startsWith('http')) {
    return processedImageUrl.value
  }
  const baseURL = api.defaults.baseURL || ''
  return `${baseURL.replace(/\/$/, '')}/${processedImageUrl.value.replace(/^\//, '')}`
})

// 文字相关
const essayText = ref('')

// 提交状态
const submitting = ref(false)
const showSuccessDialog = ref(false)
const submittedEssayShortId = ref('')
const isCopied = ref(false)

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
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options);
}

// 文字验证规则
const textRules = [
  { required: true, message: '请输入作文内容' },
  { min: 10, message: '作文内容至少需要10个字符' }
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
function showErrorMessage(msg: string) {
  errorMessage.value = msg
  showError.value = true
  message.error(msg)
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
async function fetchAssignments(studentIdStr: string) {
  try {
    loadingAssignments.value = true
    assignmentError.value = ''
    const response = await getAssignmentsForStudent(studentIdStr)
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

// 处理图片选择
async function handleImageSelected(file: File) {
  imageFile.value = file
  imageFileList.value = [{
    uid: file.name,
    name: file.name,
    status: 'uploading',
    url: URL.createObjectURL(file)
  }]

  try {
    const response = await checkEssayImage(file)
    if (response?.success && response?.processedImageUrl) {
      processedImageUrl.value = response.processedImageUrl
      imageError.value = ''
      imageFileList.value = [{
        uid: file.name,
        name: file.name,
        status: 'done',
        url: URL.createObjectURL(file)
      }]
      return false
    } else {
      throw new Error(response?.message || '图片处理失败')
    }
  } catch (error: any) {
    imageError.value = error.message || '图片处理失败'
    processedImageUrl.value = ''
    showErrorMessage(error.response?.data?.message || error.message || '图片处理失败')
    return false
  }
}

// 处理图片移除
function handleImageRemove() {
  imageFile.value = null
  imageFileList.value = []
  processedImageUrl.value = ''
  imageError.value = ''
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
  selectedClass.value = ''
  selectedStudent.value = ''
  studentId.value = ''
  selectedAssignment.value = ''
  columnCount.value = 1
  imageFile.value = null
  imageFileList.value = []
  processedImageUrl.value = ''
  essayText.value = ''
  submittedEssayShortId.value = ''
  isCopied.value = false
  showSuccessDialog.value = false
  showError.value = false
  errorMessage.value = ''

  classError.value = ''
  studentError.value = ''
  studentIdError.value = ''
  assignmentError.value = ''
  imageError.value = ''

  fetchClasses()
}

// 过滤学生选项
function filterStudentOption(input: string, option: any) {
  const name = option.name?.toLowerCase() || ''
  const studentId = option.studentId?.toLowerCase() || ''
  return name.includes(input.toLowerCase()) || studentId.includes(input.toLowerCase())
}

// 新增：当选择学生时自动填充学号
function onStudentSelected(studentIdStr: string) {
  if (studentIdStr) {
    const student = filteredStudents.value.find(s => s.studentId === studentIdStr)
    if (student) {
      selectedStudent.value = student.studentId
      studentId.value = student.studentId
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
      await fetchAssignments(student.studentId)
    }
  } else {
    studentId.value = ''
    assignments.value = []
    selectedAssignment.value = ''
  }
})

// 监听分栏数变化
watch(columnCount, (newValue) => {
  if (typeof newValue === 'string') {
    columnCount.value = parseInt(newValue) || 1
  }
  if (columnCount.value < 1) columnCount.value = 1
  if (columnCount.value > 4) columnCount.value = 4
})

// 监听提交模式变化
watch(submitMode, () => {
  imageFile.value = null
  imageFileList.value = []
  processedImageUrl.value = ''
  essayText.value = ''
  imageError.value = ''
})
</script>

<style scoped>
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--ant-color-text-base);
}

.mb-4 {
  margin-bottom: 16px;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.copy-container {
  position: relative;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--ant-color-bg-layout);
  transition: background-color 0.3s;
  text-align: center;
}

.copy-container:hover {
  background-color: var(--ant-color-bg-container);
}

.short-id {
  margin: 0;
  font-family: monospace;
  letter-spacing: 2px;
}

.copy-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 8px;
  font-size: 1rem;
}

.copy-container:hover .copy-overlay {
  opacity: 1;
}

.text-caption {
  font-size: 12px;
  color: var(--ant-color-text-secondary);
  text-align: center;
  margin-top: 8px;
}

.modal-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
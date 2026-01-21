<template>
  <div style="padding: 24px;">
    <div v-if="loading" style="display: flex; justify-content: center; align-items: center; height: 80vh;">
      <a-spin size="large" />
    </div>
    <a-alert v-else-if="error" type="error" :message="error" style="margin: 24px 0;" />
    <div v-else-if="essay">
      <!-- Top Section -->
      <a-row :gutter="16" style="margin-bottom: 16px;">
        <a-col :span="24">
          <a-button style="margin-bottom: 16px;" type="link" href="/essays">
            <template #icon><ArrowLeftOutlined /></template>
            返回作文列表
          </a-button>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card title="作文信息">
            <p><strong>测验来源:</strong> {{ essay.essayAssignment.description }}</p>
            <p><strong>测验题目:</strong> {{ essay.essayAssignment.titleContext }}</p>
            <p><strong>学生:</strong> {{ essay.student?.name }}</p>
            <p><strong>班级:</strong> {{ classInfo?.name ?? '未分配班级' }}</p>
            <p v-if="essay.isError" style="color: #ff4d4f;">
              <strong>错误信息:</strong> {{ essay.errorMessage }}
            </p>
            <div style="margin: 8px 0;">
              <strong>系统评分:</strong>
              <a-tag :color="getScoreColor(essay.finalScore, essay.essayAssignment.totalScore)" style="margin-left: 8px;">
                {{ essay.finalScore }} / {{ essay.essayAssignment.totalScore }}
              </a-tag>
            </div>
            <div v-if="essay.score && essay.score != 0" style="margin: 8px 0;">
              <strong>人工复评:</strong>
              <a-tag color="purple" style="margin-left: 8px;">
                {{ essay.score }} / {{ essay.essayAssignment.totalScore }}
              </a-tag>
              <UserOutlined style="color: #722ed1; margin-left: 8px;" />
            </div>
            <div style="margin-top: 16px;">
              <a-row :gutter="8">
                <a-col :span="24">
                  <a-button type="primary" size="large" block @click="() => setVisible(true)" v-if="essay.imageUrl">查看原文图片</a-button>
                </a-col>
                <a-col :span="24">
                  <a-button size="large" style="margin-top: 8px;" block @click="openEditScoreDialog">修改分数及学生</a-button>
                </a-col>
                <a-col :span="24">
                  <ExportToWord :essay-id="essay.id" :class-info="classInfo" block style="margin-top: 8px;" />
                </a-col>
              </a-row>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="16">
          <a-card>
            <template #title>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>原文内容</span>
                <a-button type="link" size="small" @click="onOpenEditTextDialog">
                  <template #icon><EditOutlined /></template>
                  修改标题与内容
                </a-button>
              </div>
            </template>
            <div style="white-space: pre-wrap; word-wrap: break-word;">{{ essay.parsedText }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Bottom Section -->
      <a-row :gutter="16">
        <a-col :xs="24" :lg="16">
          <a-card title="综合评判">
            <div class="markdown-body" v-html="renderedMarkdown"></div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="AI模型评分">
            <a-table
              :columns="aiResultsColumns"
              :data-source="essay.aiResults"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'score'">
                  <a-tag :color="getScoreColor(record.score, essay.essayAssignment.totalScore)">{{ record.score ?? 'N/A' }}</a-tag>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- Image Dialog -->
    <a-image :src="imageUrl" :style="{ display: 'none' }" :preview="{
        visible,
        onVisibleChange: setVisible,
      }"></a-image>

    <!-- Edit Text Dialog -->
    <a-modal
      v-model:open="editTextDialog"
      title="修改作文标题与内容"
      :closable="false"
      :maskClosable="false"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="作文标题" required>
          <a-input v-model:value="editableTitle" />
        </a-form-item>
        <a-form-item label="作文内容" required>
          <a-textarea v-model:value="editableText" :rows="15" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="editTextDialog = false">取消</a-button>
        <a-button type="primary" :loading="loading" :disabled="!editableTitle || !editableText" @click="updateTexts">保存修改</a-button>
      </template>
    </a-modal>

    <!-- Edit Score Dialog -->
    <a-modal
      v-model:open="editScoreDialog"
      title="作文评分与分配"
      :closable="false"
      :maskClosable="false"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="复评分数">
          <a-input-number
            v-model:value="editableScore"
            :min="0"
            :max="essay.essayAssignment.totalScore"
            style="width: 100%"
            :placeholder="`总分: ${essay.essayAssignment.totalScore}`"
          >
            <template #prefix><EditOutlined /></template>
          </a-input-number>
        </a-form-item>
        <a-form-item label="搜索学生">
          <a-input
            v-model:value="searchQuery"
            placeholder="搜索学生"
            allowClear
            style="margin-bottom: 8px;"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-select
            v-model:value="selectedStudentId"
            :options="filteredStudentOptions"
            :loading="loadingStudents"
            :disabled="loadingStudents"
            :placeholder="currentClassInfo ? `班级: ${currentClassInfo.name}` : '未分配班级'"
            style="width: 100%"
          >
            <template #option="{ value, label, raw }">
              <div style="display: flex; align-items: center;">
                <UserOutlined v-if="raw.classId" style="color: #1890ff; margin-right: 8px;" />
                <UserOutlined v-else style="color: #999; margin-right: 8px;" />
                <span>{{ label }}</span>
                <span style="color: #999; margin-left: 8px; font-size: 12px;">{{ raw.studentId }}</span>
              </div>
              <div v-if="loadingClass && selectedStudentId === raw.id" style="margin-top: 4px;">
                <a-progress size="small" :percent="100" status="active" :show-info="false" />
              </div>
            </template>
          </a-select>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="editScoreDialog = false">取消</a-button>
        <a-button
          type="primary"
          :loading="loading"
          :disabled="(editableScore === originalEssayScore && !selectedStudentId) || selectedStudentId === originalStudentId"
          @click="updateScore"
        >保存修改</a-button>
      </template>
    </a-modal>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftOutlined, EditOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { getSubmissionById, updateSubmissionScore, getStudents, getClassById, updateSubmissionTexts } from '@/services/apiService'
import type { Student, Class } from '@/services/apiService'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import ExportToWord from '@/components/ExportToWord.vue'
import { max } from 'lodash-es'

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    return str;
  }
})

const route = useRoute()
const essay = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const imageDialog = ref(false)
const editScoreDialog = ref(false)
const editTextDialog = ref(false)
const editableScore = ref<number | null>(null)
const editableTitle = ref<string | null>(null)
const editableText = ref<string | null>(null)
const students = ref<Student[]>([])
const selectedStudentId = ref<string | undefined>(undefined)
const originalStudentId = ref<string | undefined>(undefined)
const originalEssayScore = ref<number | null>(null)
const searchQuery = ref('')
const loadingStudents = ref(false)
const classInfo = ref<Class | null>(null)
const loadingClass = ref(false)
const classCache = ref<Map<string, Class>>(new Map())
const classCacheExpiry = ref<Map<string, number>>(new Map())
const CACHE_EXPIRY_TIME = 5 * 60 * 1000

// 添加 imageUrl 计算属性
const imageUrl = computed(() => {
  if (!essay.value?.imageUrl) return '';
  if (!import.meta.env.VITE_API_BASE_URL) return `http://localhost:5000${essay.value.imageUrl}`;
  return `${import.meta.env.VITE_API_BASE_URL}${essay.value.imageUrl}`;
});

const currentClassInfo = computed(() => {
  if (selectedStudentId.value) {
    const selectedStudent = students.value.find(s => s.id === selectedStudentId.value);
    if (selectedStudent?.classId) {
      const cachedClass = getClassFromCache(selectedStudent.classId);
      if (cachedClass) {
        return cachedClass;
      }
    }
  }
  return classInfo.value;
});

// 从缓存获取班级信息
const getClassFromCache = (classId: string|undefined): Class | null => {
  if(classId == undefined) return null;

  const cachedClass = classCache.value.get(classId);
  const expiryTime = classCacheExpiry.value.get(classId);

  if (cachedClass && expiryTime && Date.now() < expiryTime) {
    return cachedClass;
 }

  if (cachedClass) {
    classCache.value.delete(classId);
    classCacheExpiry.value.delete(classId);
  }

  return null;
};

// 将班级信息存入缓存
const setClassCache = (classId: string, classData: Class) => {
  classCache.value.set(classId, classData);
  classCacheExpiry.value.set(classId, Date.now() + CACHE_EXPIRY_TIME);
};


const fetchClassInfo = async (classId: string) => {
  if (!classId) return;

  const cachedClass = getClassFromCache(classId);
  if (cachedClass) {
    classInfo.value = cachedClass;
    return;
  }

  loadingClass.value = true;
  try {
    const data = await getClassById(classId);
    classInfo.value = data;
    setClassCache(classId, data);
  } catch (err) {
    console.error('Failed to load class info:', err);
  } finally {
    loadingClass.value = false;
  }
};

// 将 computed 属性提到前面并添加类型
const filteredStudents = computed<Student[]>(() => {
  if (!searchQuery.value) return students.value;
  const query = searchQuery.value.toLowerCase();
  return students.value.filter(student =>
    student.name.toLowerCase().includes(query) ||
    student.studentId?.toLowerCase().includes(query)
  );
});

// Filtered student options for select
const filteredStudentOptions = computed(() => {
  return filteredStudents.value.map(student => ({
    value: student.id,
    label: student.name,
    raw: student
  }))
})

// 添加计算属性用于markdown渲染
const renderedMarkdown = computed(() => {
  if (!essay.value?.judgeResult) return '';
  return md.render(essay.value.judgeResult);
});

// AI Results table columns
const aiResultsColumns = [
  {
    title: '模型',
    dataIndex: 'modelName',
    key: 'modelName',
    ellipsis: true,
  },
  {
    title:"评价",
    dataIndex: 'feedback',
    key: 'feedback',
    align:"center",
    ellipsis: true,
  },
  {
    title: '分数',
    dataIndex: 'score',
    key: 'score',
    align:"right",
  },
];

const fetchEssay = async () => {
  const id = (route.params as { id: string }).id;
  try {
    const data = await getSubmissionById(id);
    essay.value = data;
    if (data.student?.classId) {
      await fetchClassInfo(data.student?.classId);
    }
  } catch (err) {
    error.value = '加载作文失败，请稍后再试。'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchStudents = async () => {
  loadingStudents.value = true;
  try {
    students.value = await getStudents({});
  } catch (err) {
    console.error('Failed to load students:', err);
    error.value = '加载学生列表失败';
  } finally {
    loadingStudents.value = false;
  }
}

const getScoreColor = (score: number | null, totalScore: number) => {
  if (score === null) return 'default'
  const percentage = (score / totalScore) * 100
  if (percentage >= 50) return 'green'
  if (percentage >= 42) return 'cyan'
  if (percentage >= 38) return 'orange'
  return 'red'
}

const openEditScoreDialog = () => {
  if (essay.value) {
    selectedStudentId.value = essay.value.studentId;
    originalStudentId.value = essay.value.studentId;
    originalEssayScore.value = essay.value.score;
    searchQuery.value = '';
    if (essay.value.student?.classId) {
      fetchClassInfo(essay.value.student.classId);
    }
    editScoreDialog.value = true;
  }
};

const updateScore = async () => {
  if (essay.value === null) return;
  const id = (route.params as { id: string }).id;

  try {
    const studentChanged = selectedStudentId.value !== originalStudentId.value;
    await updateSubmissionScore(
      id,
      editableScore.value ? editableScore.value : undefined,
      studentChanged ? selectedStudentId.value : undefined
    );
    editScoreDialog.value = false;
    await fetchEssay();
  } catch (err) {
    console.error('Failed to update:', err);
    error.value = '更新失败';
  }
};

const visible = ref<boolean>(false);
const setVisible = (val: boolean): void => {
  visible.value = val;
};

const onOpenEditTextDialog = () => {
  if (essay.value) {
    editableTitle.value = essay.value.title ?? '';
    editableText.value = essay.value.parsedText ?? '';
    editTextDialog.value = true;
  }
};

const updateTexts = async () => {
  if (essay.value === null) return;
  const id = (route.params as { id: string }).id;
  try {
    await updateSubmissionTexts(
      id,
      editableText.value ?? '',
      editableTitle.value ?? ''
    );
    editTextDialog.value = false;
    await fetchEssay();
  } catch (err) {
    console.error('Failed to update:', err);
    error.value = '更新失败';
  }
};

// 监听选中学生的变化
watch(selectedStudentId, async (newStudentId) => {
  if (newStudentId) {
    const selectedStudent = students.value.find(s => s.id === newStudentId);
    if (selectedStudent?.class) {
      await fetchClassInfo(selectedStudent.class.id);
    } else {
      classInfo.value = null;
    }
  } else {
    classInfo.value = null;
  }
});

onMounted(async () => {
  await Promise.all([
    fetchEssay(),
    fetchStudents()
  ]);
});

</script>

<style>
@import 'github-markdown-css/github-markdown.css';

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  background-color: transparent !important;
  color: inherit !important;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body p {
  margin: 0.5em 0;
}

.markdown-body pre,
.markdown-body code {
  background-color: rgba(110, 118, 129, 0.1) !important;
  border-radius: 4px;
}

.markdown-body pre {
  padding: 1em;
}

.markdown-body code {
  padding: 0.2em 0.4em;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #8b949e;
  border-left: 0.25em solid #30363d;
}

/* 表格样式修复 */
.markdown-body table {
  display: table; /* 恢复表格的正常显示 */
  border-collapse: collapse;
  margin: 0;
  overflow: auto;
  width: 100%;
  background-color: var(--ant-color-bg-container);
}

.markdown-body table tr {
  background-color: var(--ant-color-bg-container);
  border-top: 1px solid var(--ant-color-split);
}

.markdown-body table tr:nth-child(2n) {
  background-color: var(--ant-color-fill-secondary);
}

.markdown-body table td,
.markdown-body table th {
  padding: 6px 13px;
  border: 1px solid var(--ant-color-split);
  color: var(--ant-color-text);
}

.markdown-body table th {
  background-color: var(--ant-color-fill-content);
  font-weight: 600;
}

.markdown-body table td {
  background-color: var(--ant-color-bg-container);
}

.markdown-body table tr:hover {
  background-color: var(--ant-color-fill);
}
</style>

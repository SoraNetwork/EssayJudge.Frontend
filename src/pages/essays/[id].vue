<template>
  <v-container>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="error" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-alert type="error">{{ error }}</v-alert>
    </div>
    <div v-else-if="essay">
      <!-- Top Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-btn class="mb-4" 
            prepend-icon="mdi-arrow-left" 
            variant="text" 
            :to="'/essays'">
            返回作文列表
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-h5">
              作文信息
            </v-card-title>
            <v-card-text>
              <p><strong>测验来源:</strong> {{ essay.essayAssignment.description }}</p>
              <p><strong>测验题目:</strong> {{ essay.essayAssignment.titleContext }}</p>
              <p><strong>学生:</strong> {{ essay.student?.name }}</p>
              <p><strong>班级:</strong> {{ classInfo?.name ?? '未分配班级' }}</p>
              <p v-if="essay.isError" class="error--text">
                <strong>错误信息:</strong> {{ essay.errorMessage }}
              </p>
              <v-list-item>
                <v-list-item-title class="text-subtitle-1">
                  <strong>系统评分:</strong>
                  <v-chip :color="getScoreColor(essay.finalScore, essay.essayAssignment.totalScore)" dark small class="ml-2">
                    {{ essay.finalScore }} / {{ essay.essayAssignment.totalScore }}
                  </v-chip>
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="essay.score && essay.score != 0">
                <v-list-item-title class="text-subtitle-1">
                  <strong>人工复评:</strong>
                  <v-chip color="purple" dark small class="ml-2">
                    {{ essay.score }} / {{ essay.essayAssignment.totalScore }}
                  </v-chip>
                  <v-icon small color="purple" class="ml-2">mdi-account-check</v-icon>
                </v-list-item-title>
              </v-list-item>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-row dense>
                <v-col cols="12">
                  <v-btn color="primary" block @click="imageDialog = true" v-if="essay.imageUrl">查看原文图片</v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn color="secondary" block @click="openEditDialog">修改分数及学生</v-btn>
                </v-col>
                <v-col cols="12">
                  <ExportToWord 
                    :essay-id="essay.id"
                    :class-info="classInfo" 
                    block
                  />
                </v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>原文内容</v-card-title>
            <v-card-text style="white-space: pre-wrap; word-wrap: break-word;">{{ essay.parsedText }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bottom Section -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-title>综合评判</v-card-title>
            <v-card-text class="markdown-body">
              <div v-html="renderedMarkdown"></div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card>
            <v-card-title>AI模型评分</v-card-title>
            <v-list dense>
              <v-list-item v-for="result in essay.aiResults" :key="result.id">
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">{{ result.modelName }}</v-list-item-title>
                  <v-list-item-subtitle>{{ result.feedback }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip :color="getScoreColor(result.score, essay.essayAssignment.totalScore)" dark>{{ result.score ?? 'N/A' }}</v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Image Dialog -->
    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-img :src="imageUrl"></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="imageDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" persistent max-width="600px">
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>作文评分与分配</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="editDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="editableScore"
                  label="复评分数"
                  type="number"
                  :rules="[v => v !== null && v !== '' || '分数不能为空', v => v <= essay.essayAssignment.totalScore || `分数不能超过总分 ${essay.essayAssignment.totalScore}`, v => v > 0 || `分数必须大于0`]"
                  :hint="`总分: ${essay.essayAssignment.totalScore}`"
                  persistent-hint
                  outlined
                  dense
                  clearable
                >
                  <template v-slot:append>
                    <v-icon color="primary">mdi-pencil</v-icon>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="searchQuery"
                  label="搜索学生"
                  prepend-inner-icon="mdi-magnify"
                  outlined
                  dense
                  clearable
                  hide-details
                  class="mb-2"
                ></v-text-field>
                <v-select
                  v-model="selectedStudentId"
                  :items="filteredStudents"
                  item-title="name"
                  item-value="id"
                  label="选择学生"
                  :loading="loadingStudents"
                  :disabled="loadingStudents"
                  :hint="currentClassInfo ? `班级: ${currentClassInfo.name}` : '未分配班级'"
                  persistent-hint
                  outlined
                  dense
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="item.raw.classId ? 'primary' : 'grey'">
                          {{ item.raw.classId ? 'mdi-account-school' : 'mdi-account' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>
                        {{ item.raw.name }}
                        <span class="text-caption text--secondary ml-2">
                          {{ item.raw.studentId }}
                        </span>
                      </v-list-item-title>
                      <v-list-item-subtitle v-if="loadingClass && selectedStudentId === item.raw.id">
                        <v-progress-linear indeterminate height="2"></v-progress-linear>
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-else>
                        {{ getClassFromCache(item.raw.classId)?.name || '未分配班级' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="grey-darken-1"
            @click="editDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            :disabled="editableScore === null"
            @click="updateScore"
          >
            保存修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BackToTop />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSubmissionById, updateSubmissionScore, getStudents, getClassById } from '@/services/apiService'
import type { Student, Class } from '@/services/apiService'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import ExportToWord from '@/components/ExportToWord.vue'

// 初始化 markdown-it 时添加更多配置
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,    // 转换段落里的 '\n' 到 <br>
  highlight: function (str, lang) {
    // 可以在这里添加代码高亮功能
    return str;
  }
})

const route = useRoute()
const essay = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const imageDialog = ref(false)
const editDialog = ref(false)
const editableScore = ref<number | null>(null)
const students = ref<Student[]>([])
const selectedStudentId = ref<string | undefined>(undefined)
const originalStudentId = ref<string | undefined>(undefined)
const searchQuery = ref('')
const loadingStudents = ref(false)
const classInfo = ref<Class | null>(null)
const loadingClass = ref(false)
// 添加班级信息缓存
const classCache = ref<Map<string, Class>>(new Map())
const classCacheExpiry = ref<Map<string, number>>(new Map())
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5分钟缓存过期时间

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
      // 如果有缓存的班级信息，优先使用缓存
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
  
  // 如果缓存过期，清除缓存
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
  
  // 先尝试从缓存获取
  const cachedClass = getClassFromCache(classId);
  if (cachedClass) {
    classInfo.value = cachedClass;
    return;
  }
  
  loadingClass.value = true;
  try {
    const data = await getClassById(classId);
    classInfo.value = data;
    // 存入缓存
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

// 添加计算属性用于markdown渲染
const renderedMarkdown = computed(() => {
  if (!essay.value?.judgeResult) return '';
  return md.render(essay.value.judgeResult);
});

const fetchEssay = async () => {
  const id = (route.params as { id: string }).id;
  try {
    const data = await getSubmissionById(id);
    essay.value = data;
    // 获取作文当前学生的班级信息
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
  if (score === null) return 'grey'
  const percentage = (score / totalScore) * 100
  if (percentage >= 50) return 'green'
  if (percentage >= 42) return 'light-green'
  if (percentage >= 38) return 'orange'
  return 'red'
}

const openEditDialog = () => {
  if (essay.value) {
    editableScore.value = essay.value.score || essay.value.finalScore;
    selectedStudentId.value = essay.value.studentId;
    originalStudentId.value = essay.value.studentId;
    searchQuery.value = '';
    // 重新获取当前学生的班级信息
    if (essay.value.student?.classId) {
      fetchClassInfo(essay.value.student.classId);
    }
    editDialog.value = true;
  }
};

const updateScore = async () => {
  if (editableScore.value === null || essay.value === null) return;
  const id = (route.params as { id: string }).id;
  
  try {
    // 只有当分配的学生发生改变时才传递 studentId
    const studentChanged = selectedStudentId.value !== originalStudentId.value;
    await updateSubmissionScore(
      id, 
      editableScore.value, 
      studentChanged ? selectedStudentId.value : undefined
    );
    editDialog.value = false;
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
    if (selectedStudent?.classId) {
      await fetchClassInfo(selectedStudent.classId);
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
</style>
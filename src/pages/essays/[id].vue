<template>
  <v-container fluid>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="error" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-alert type="error">{{ error }}</v-alert>
    </div>
    <div v-else-if="essay">
      <!-- Top Section -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-h5">作文信息</v-card-title>
            <v-card-text>
              <p><strong>测验题目:</strong> {{ essay.essayAssignment.description }}</p>
              <p><strong>学生:</strong> {{ essay.student?.name }}</p>
              <p><strong>班级:</strong> {{ classInfo?.name ?? '未分配班级' }}</p>
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
                  <v-btn color="secondary" block @click="openEditDialog">修改分数</v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn color="info" block @click="exportToPDF" :loading="exportingPDF">
                    <v-icon left>mdi-file-word</v-icon>
                    导出Word
                  </v-btn>
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
        <v-img :src="`http://localhost:5000${essay?.imageUrl}`"></v-img>
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
                  placeholder="输入姓名、学号或班级进行搜索..."
                  outlined
                  dense
                  clearable
                  :loading="loadingStudents"
                  :disabled="loadingStudents"
                >
                  <template v-slot:append>
                    <v-icon color="primary">mdi-magnify</v-icon>
                  </template>
                </v-text-field>

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

    <!-- 用于PDF导出的隐藏内容 -->
    <div ref="pdfContent" style="display: none;">
      <div class="pdf-container">
        <h1>{{ essay?.title }}</h1>
        
        <div class="info-section">
          <p><strong>学生姓名：</strong>{{ essay?.student?.name }}</p>
          <p><strong>班级：</strong>{{ classInfo?.name }}</p>
          <p><strong>年级：</strong>{{ essay?.essayAssignment?.grade }}</p>
          <p><strong>题目：</strong>{{ essay?.essayAssignment?.titleContext }}</p>
          <p><strong>得分：</strong>{{ essay?.finalScore }}</p>
        </div>

        <div class="judge-section">
          <div v-html="renderedMarkdown"></div>
        </div>

        <div class="ai-results">
          <h2>AI评分详情</h2>
          <div v-for="result in essay?.aiResults" :key="result.id" class="ai-result-item">
            <h3>{{ result.modelName }}</h3>
            <p>{{ result.feedback }}</p>
            <p class="score">得分：{{ result.score }}</p>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSubmissionById, updateSubmissionScore, getStudents, getClassById } from '@/services/apiService'
import type { Student, Class } from '@/services/apiService'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle, type IParagraphOptions } from 'docx'
import { saveAs } from 'file-saver'

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
  if (percentage >= 90) return 'green'
  if (percentage >= 75) return 'light-green'
  if (percentage >= 60) return 'orange'
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

// 存储PDF导出内容的DOM引用
const pdfContent = ref<HTMLElement | null>(null);
// 控制导出按钮加载状态的标志
const exportingPDF = ref(false);

// 将Markdown文本转换为DOCX段落数组的函数
const convertMarkdownToParagraphs = (markdownText: string): Array<Paragraph | Table> => {
  // 将Markdown转换为HTML
  const html = md.render(markdownText);
  // 创建DOM解析器
  const parser = new DOMParser();
  // 解析HTML字符串为DOM文档
  const doc = parser.parseFromString(html, 'text/html');
  // 存储转换后的段落数组
  const elements: Array<Paragraph | Table> = [];

  // 处理单个DOM节点的函数，返回对应的DOCX段落对象
  const processNode = (node: Element): Paragraph | Paragraph[] | Table => {
    switch (node.tagName.toLowerCase()) {
      // 处理一级标题
      case 'h1':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_1 });
      // 处理二级标题
      case 'h2':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_2 });
      // 处理三级标题
      case 'h3':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_3 });
      // 处理普通段落
      case 'p':
        return new Paragraph({ text: node.textContent || '' });
      // 处理引用块
      case 'blockquote':
        return new Paragraph({
          text: node.textContent || '',
          indent: { left: 720 },
          border: { left: { style: 'single', size: 12, color: '666666' } }
        });
      // 处理无序列表和有序列表
      case 'ul':
      case 'ol':
        return Array.from(node.children).map(li => 
          new Paragraph({
            text: li.textContent || '',
            bullet: { level: 0 }
          })
        );
      // 处理代码块
      case 'pre':
        return new Paragraph({
          text: node.textContent || '',
          spacing: { before: 240, after: 240 },
          shading: { type: 'solid', fill: 'F0F0F0' }
        });
      // 处理表格
      case 'table':
        const rows = Array.from(node.querySelectorAll('tr'));
        return new Table({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 }
          },
          rows: rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return new TableRow({
              children: cells.map(cell => {
                return new TableCell({
                  children: [new Paragraph(cell.textContent || '')],
                  verticalAlign: "center"
                });
              }),
            });
          }),
        });
      // 处理其他类型节点
      default:
        return new Paragraph({ text: node.textContent || '' });
    }
  };

  // 遍历处理所有根节点
  Array.from(doc.body.children).forEach(node => {
    const result = processNode(node);
    // 处理返回结果可能是数组的情况
    if (Array.isArray(result)) {
      elements.push(...result);
    } else {
      elements.push(result);
    }
  });

  return elements;
};

// 导出为Word文档的主函数
const exportToPDF = async () => {
  // 检查是否有作文数据
  if (!essay.value) return;
  
  // 设置导出状态为true
  exportingPDF.value = true;
  try {
    // 创建Word文档对象
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: "20mm",       // 默认值为20mm，减少5mm
              right: "12.7mm",     // 保持默认值
              bottom: "20mm",    // 默认值为20mm，减少5mm
              left: "12.7mm",      // 保持默认值
            }
          }
        },
        children: [
          // 添加作文标题
          /*(new Paragraph({
            text: essay.value.title,
            heading: HeadingLevel.HEADING_1,
          }),*/
          // 添加学生信息
          new Paragraph({
            children: [
              new TextRun({ text: "学生姓名：", bold: true }),
              new TextRun(essay.value.student?.name || ""),
            ],
          }),
          // 添加班级信息
          new Paragraph({
            children: [
              new TextRun({ text: "班级：", bold: true }),
              new TextRun(classInfo.value?.name || "未分配班级"),
            ],
          }),
          // 添加年级信息
          new Paragraph({
            children: [
              new TextRun({ text: "年级：", bold: true }),
              new TextRun(essay.value.essayAssignment?.grade || ""),
            ],
          }),
          // 添加题目信息
          new Paragraph({
            children: [
              new TextRun({ text: "题目：", bold: true }),
              new TextRun(essay.value.essayAssignment?.titleContext || ""),
            ],
          }),
          // 添加得分信息
          new Paragraph({
            children: [
              new TextRun({ text: "得分：", bold: true }),
              new TextRun(essay.value.finalScore?.toString() || ""),
            ],
          }),
          // 添加综合评判标题
          /*
          new Paragraph({
            text: "综合评判",
            heading: HeadingLevel.HEADING_2,
          }),*/
          // 添加转换后的评判内容
          ...convertMarkdownToParagraphs(essay.value.judgeResult || ""),
          // 添加AI评分详情标题
          new Paragraph({
            text: "AI评分详情",
            heading: HeadingLevel.HEADING_2,
          }),
          // 添加所有AI评分结果
          ...essay.value.aiResults.map((result: { modelName: any; feedback: string | IParagraphOptions; score: { toString: () => any } }) => [
            new Paragraph({
              text: result.modelName,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(result.feedback),
            new Paragraph({
              children: [
                new TextRun({ text: "得分：", bold: true }),
                new TextRun(result.score?.toString() || "N/A"),
              ],
            }),
          ]).flat(),
        ],
      }],
    });

    // 将文档转换为Blob对象
    const buffer = await Packer.toBlob(doc);
    // 使用FileSaver保存文件
    saveAs(buffer, `${essay.value.title || '作文评分'}.docx`);
  } catch (error) {
    // 打印导出错误
    console.error('Word导出失败:', error);
  } finally {
    // 重置导出状态
    exportingPDF.value = false;
  }
};

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

/* PDF导出样式 */
.pdf-container {
  padding: 20px;
  font-family: "Microsoft YaHei", sans-serif;
  max-width: 100%;
  margin: 0 auto;
}

.info-section,
.judge-section,
.ai-results,
.ai-result-item {
  break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 20px;
  width: 100%;
}
</style>
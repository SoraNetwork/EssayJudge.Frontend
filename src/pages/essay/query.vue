<template>
  <div>
    <h1 class="text-h4 mb-4">查询作文提交状态</h1>

    <v-card>
      <v-card-text>
        <v-form @submit.prevent="queryEssay">
          <v-text-field v-model="shortId" label="输入8位作文ID进行查询" :rules="shortIdRules" maxlength="8" counter clearable
            class="mb-4" />
          <div class="d-flex justify-end">
            <v-btn type="submit" color="primary" :loading="loading" :disabled="!shortId || shortId.length !== 8">
              查询
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card v-if="loading" class="mt-4">
      <v-card-text>
        <v-progress-linear indeterminate />
        <div class="text-center mt-4">正在查询...</div>
      </v-card-text>
    </v-card>

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>

    <v-card v-if="essay" class="mt-4">
      <v-card-title>作文详情</v-card-title>
      <v-card-text>
        <v-list lines="two">
          <v-list-item title="作文ID" :subtitle="essay.id" />
          <v-list-item title="学生姓名" :subtitle="essay.student.name" />
          <v-list-item title="学号" :subtitle="essay.student.studentId" />
          <v-list-item title="提交时间" :subtitle="formatDate(essay.createdAt)" />
          <v-list-item title="状态" :subtitle="displayStatus" />
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="info" @click="exportToWord" :loading="exportingWord">
          <v-icon left>mdi-file-word</v-icon>
          导出Word
        </v-btn>
        <!--
        <v-btn color="primary" @click="goToEssayDetail">
          查看详情
        </v-btn>
        -->
      </v-card-actions>
    </v-card>

    <v-card v-if="essay && essay.judgeResult" class="mt-4">
      <v-card-title>综合评判</v-card-title>
      <v-card-text class="markdown-body">
        <div v-html="renderedMarkdown"></div>
      </v-card-text>
    </v-card>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { queryEssayByShortId, type QueriedEssay as Essay } from '@/services/apiService'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
// 添加必要的导入
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { errorMessages } from 'vue/compiler-sfc'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

const route = useRoute()
const router = useRouter()

const errorMessage = ref('')
const shortId = ref('')
const essay = ref<Essay | null>(null)
const loading = ref(false)
const error = ref('')
// 添加导出状态
const exportingWord = ref(false)

const renderedMarkdown = computed(() => {
  if (!essay.value?.judgeResult) return ''
  return md.render(essay.value.judgeResult)
})

const displayStatus = computed(() => {
  if (!essay.value) return ''
  if (essay.value.finalScore !== null && essay.value.finalScore !== undefined) {
    return `批改完成，分数为 ${essay.value.finalScore}`
  }
  if (essay.value.isError) {
    return '批改错误'
  }
  return '批改中'
})

const shortIdRules = [
  (v: string) => !!v || '请输入ID',
  (v: string) => (v && v.length === 8) || 'ID必须是8位',
]

function goToEssayDetail() {
  if (essay.value) {
    router.push(`/essays/${essay.value.id}`)
  }
}

// 添加导出到Word的功能
const exportToWord = async () => {
  if (!essay.value) return;

  exportingWord.value = true;
  try {
    // 获取班级信息（如果需要）
    let className = '未分配班级';
    if (essay.value.student && (essay.value as any).student.class) {
      className = (essay.value as any).student.class.name;
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: "20mm",
              right: "12.7mm",
              bottom: "20mm",
              left: "12.7mm",
            }
          }
        },
        children: [
          // 添加作文标题
          new Paragraph({
            text: essay.value?.title || '作文',
            heading: HeadingLevel.HEADING_1,
          }),
          // 添加学生信息
          new Paragraph({
            children: [
              new TextRun({ text: "学生姓名：", bold: true }),
              new TextRun(essay.value.student?.name || ""),
            ],
          }),
          // 添加学号信息
          new Paragraph({
            children: [
              new TextRun({ text: "学号：", bold: true }),
              new TextRun(essay.value.student?.studentId || ""),
            ],
          }),
          // 添加班级信息
          new Paragraph({
            children: [
              new TextRun({ text: "班级：", bold: true }),
              new TextRun(className),
            ],
          }),
          // 添加提交时间
          new Paragraph({
            children: [
              new TextRun({ text: "提交时间：", bold: true }),
              new TextRun(formatDate(essay.value.createdAt)),
            ],
          }),
          // 添加得分信息
          new Paragraph({
            children: [
              new TextRun({ text: "得分：", bold: true }),
              new TextRun(essay.value.finalScore?.toString() || "未评分"),
            ],
          }),
          // 添加综合评判标题
          new Paragraph({
            text: "综合评判",
            heading: HeadingLevel.HEADING_2,
          }),
          // 添加转换后的评判内容
          ...convertMarkdownToParagraphs(essay.value.judgeResult || ""),
        ],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${essay.value.title || '作文评分'}.docx`);
  } catch (err: any) {
    console.error('Word导出失败:', error);
    errorMessage.value = '导出失败，请稍后再试。';
  } finally {
    exportingWord.value = false;
  }
};

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

async function queryEssay() {
  if (!shortId.value || shortId.value.length !== 8) {
    error.value = '请输入有效的8位作文ID。'
    return
  }
  // 自动转为大写
  shortId.value = shortId.value.toUpperCase()

  loading.value = true
  error.value = ''
  essay.value = null
  try {
    const response = await queryEssayByShortId(shortId.value)
    if (response) {
      essay.value = response
      // Update URL without reloading
      router.push({ query: { id: shortId.value } })
    } else {
      error.value = '未找到对应的作文记录。'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '查询失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}

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

onMounted(() => {
  if (route.query.id && typeof route.query.id === 'string') {
    shortId.value = route.query.id.toUpperCase()
    queryEssay()
  }
})

watch(() => route.query.id, (newId) => {
  if (newId && typeof newId === 'string' && newId.toUpperCase() !== shortId.value) {
    shortId.value = newId.toUpperCase()
    queryEssay()
  }
})
</script>

<style>
.markdown-body {
  background-color: transparent !important;
  color: inherit !important;
  font-size: 1rem;
}
</style>

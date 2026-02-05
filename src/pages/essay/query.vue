<template>
  <div class="query-container">
    <h1 class="page-title">查询作文提交状态</h1>

    <a-card>
      <a-form @finish="queryEssay" layout="vertical">
        <a-form-item
          label="输入8位作文ID进行查询"
          name="shortId"
          :rules="shortIdRules"
        >
          <a-input
            v-model:value="shortId"
            placeholder="请输入8位作文ID"
            maxlength="8"
            show-count
            allow-clear
            @input="shortId = shortId.toUpperCase()"
          />
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            @click="queryEssay"
            :loading="loading"
            :disabled="!shortId || shortId.length !== 8"
          >
            查询
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card v-if="loading" class="mt-4">
      <a-spin tip="正在查询...">
        <div style="height: 100px;"></div>
      </a-spin>
    </a-card>

    <a-card v-if="essay" class="mt-4">
      <template #title>作文详情</template>
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="作文ID">{{ essay.id }}</a-descriptions-item>
        <a-descriptions-item label="学生姓名">{{ essay.student.name }}</a-descriptions-item>
        <a-descriptions-item label="学号">{{ essay.student.studentId }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ formatDateUTC8(essay.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ displayStatus }}</a-descriptions-item>
      </a-descriptions>
      <template #extra>
        <a-button
          type="primary"
          @click="exportToWord"
          :loading="exportingWord"
        >
          <template #icon>
            <FileWordOutlined />
          </template>
          导出Word
        </a-button>
      </template>
    </a-card>

    <a-card v-if="essay && essay.judgeResult" class="mt-4">
      <template #title>综合评判</template>
      <div class="markdown-body" v-html="renderedMarkdown"></div>
    </a-card>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileWordOutlined } from '@ant-design/icons-vue'
import { queryEssayByShortId, type QueriedEssay as Essay } from '@/services/apiService'
import { formatDateUTC8 } from '@/composables/useDateFormat'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import BackToTop from '@/components/BackToTop.vue'

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
  { len: 8, message: 'ID必须是8位' },
]

function goToEssayDetail() {
  if (essay.value) {
    router.push(`/essays/${essay.value.id}`)
  }
}

const exportToWord = async () => {
  if (!essay.value) return;

  exportingWord.value = true;
  try {
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
          new Paragraph({
            text: essay.value?.title || '作文',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "学生姓名：", bold: true }),
              new TextRun(essay.value.student?.name || ""),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "学号：", bold: true }),
              new TextRun(essay.value.student?.studentId || ""),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "班级：", bold: true }),
              new TextRun(className),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "提交时间：", bold: true }),
              new TextRun(formatDateUTC8(essay.value.createdAt)),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "得分：", bold: true }),
              new TextRun(essay.value.finalScore?.toString() || "未评分"),
            ],
          }),
          new Paragraph({
            text: "综合评判",
            heading: HeadingLevel.HEADING_2,
          }),
          ...convertMarkdownToParagraphs(essay.value.judgeResult || ""),
        ],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${essay.value.title || '作文评分'}.docx`);
  } catch (err: any) {
    console.error('Word导出失败:', err);
    errorMessage.value = '导出失败，请稍后再试。';
  } finally {
    exportingWord.value = false;
  }
};

const convertMarkdownToParagraphs = (markdownText: string): Array<Paragraph | Table> => {
  const html = md.render(markdownText);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: Array<Paragraph | Table> = [];

  const processNode = (node: Element): Paragraph | Paragraph[] | Table => {
    switch (node.tagName.toLowerCase()) {
      case 'h1':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_1 });
      case 'h2':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_2 });
      case 'h3':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_3 });
      case 'p':
        return new Paragraph({ text: node.textContent || '' });
      case 'blockquote':
        return new Paragraph({
          text: node.textContent || '',
          indent: { left: 720 },
          border: { left: { style: 'single', size: 12, color: '666666' } }
        });
      case 'ul':
      case 'ol':
        return Array.from(node.children).map(li =>
          new Paragraph({
            text: li.textContent || '',
            bullet: { level: 0 }
          })
        );
      case 'pre':
        return new Paragraph({
          text: node.textContent || '',
          spacing: { before: 240, after: 240 },
          shading: { type: 'solid', fill: 'F0F0F0' }
        });
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
      default:
        return new Paragraph({ text: node.textContent || '' });
    }
  };

  Array.from(doc.body.children).forEach(node => {
    const result = processNode(node);
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
  shortId.value = shortId.value.toUpperCase()

  loading.value = true
  error.value = ''
  essay.value = null
  try {
    const response = await queryEssayByShortId(shortId.value)
    if (response) {
      essay.value = response
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

<style scoped>
.query-container {
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

.mt-4 {
  margin-top: 16px;
}

.markdown-body {
  background-color: transparent !important;
  color: inherit !important;
  font-size: 1rem;
}
</style>
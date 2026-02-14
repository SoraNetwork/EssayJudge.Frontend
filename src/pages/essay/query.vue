<template>
 <div>
  <div style="margin-bottom: 16px;">
    <a-radio-group v-model:value="queryMode" button-style="solid">
      <a-radio-button value="queryByShortId">按作文查询码查询</a-radio-button>
      <a-radio-button value="queryByStudentId">按学生考号查询</a-radio-button>
    </a-radio-group>
  </div>

  <div v-if="queryMode === 'queryByShortId'">
    <a-card style="margin-bottom: 16px;">
      <a-row :gutter="16">
        <a-col :span="16">
          <a-input
            v-model:value="shortId"
            placeholder="请输入8位作文查询码"
            maxlength="8"
            show-count
            allow-clear
            @input="shortId = shortId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)"
            @keydown.enter="queryEssay"
          />
        </a-col>
        <a-col :span="8">
          <a-button
            type="primary"
            block
            @click="queryEssay"
            :loading="loading"
            :disabled="!shortId || shortId.length !== 8"
          >
            查询
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-spin :spinning="loading">
      <a-empty v-if="error" :description="error" />

      <div v-if="essay">
        <a-card style="margin-bottom: 16px;">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="作文ID">{{ essay.id }}</a-descriptions-item>
            <a-descriptions-item label="学生姓名">{{ essay.student.name }}</a-descriptions-item>
            <a-descriptions-item label="学号">{{ essay.student.studentId }}</a-descriptions-item>
            <a-descriptions-item label="提交时间">{{ formatDateUTC8(essay.createdAt) }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="essay.isError ? 'error' : (essay.finalScore !== null && essay.finalScore !== undefined ? 'success' : 'processing')">
                {{ displayStatus }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item>
              <a-button
                type="primary"
                size="small"
                @click="exportToWord"
                :loading="exportingWord"
              >
                <template #icon><FileWordOutlined /></template>
                导出Word
              </a-button>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card v-if="essay.judgeResult">
          <template #title>综合评判</template>
          <MarkdownRenderer :content="essay.judgeResult" />
        </a-card>
      </div>
    </a-spin>
  </div>

  <div v-else-if="queryMode === 'queryByStudentId'">
    <a-card style="margin-bottom: 16px;">
      <a-row :gutter="16">
        <a-col :span="16">
          <a-input
            v-model:value="studentId"
            placeholder="请输入8位学生考号"
            maxlength="8"
            show-count
            allow-clear
            @input="studentId = studentId.replace(/\D/g, '').slice(0, 8)"
            @keydown.enter="queryStudent"
          />
        </a-col>
        <a-col :span="8">
          <a-button
            type="primary"
            block
            @click="queryStudent"
            :loading="loading"
            :disabled="!studentId || studentId.length !== 8"
          >
            查询
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-spin :spinning="loading">
      <a-empty v-if="error" :description="error" />

      <div v-if="finishedAssignments.length > 0">
        <a-card style="margin-bottom: 16px;">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="姓名">{{ finishedAssignments[0].student.name }}</a-descriptions-item>
            <a-descriptions-item label="学号">{{ finishedAssignments[0].student.studentId }}</a-descriptions-item>
            <a-descriptions-item label="提交数量">{{ finishedAssignments.length }} 篇</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card>
          <template #title>提交列表（点击复制查询码）</template>
          <a-table
            :dataSource="finishedAssignments"
            :columns="submissionColumns"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: any) => `共 ${total} 条` }"
            row-key="id"
            :customRow="(record: { id: string }) => ({
              onClick: () => copyShortId(record.id),
              style: { cursor: 'pointer' }
            })"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <a-tooltip :title="copyTooltipVisible === record.id ? '已复制！' : '点击复制查询码'">
                  <span>{{ record.title }}</span>
                </a-tooltip>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.isError ? 'error' : (record.finalScore !== null && record.finalScore !== undefined ? 'success' : 'processing')">
                  {{ record.isError ? '批改错误' : (record.finalScore !== null && record.finalScore !== undefined ? '批改完成' : '批改中') }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'finalScore'">
                <span v-if="record.finalScore !== null && record.finalScore !== undefined">{{ record.finalScore }}</span>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'createdAt'">
                {{ formatDateUTC8(record.createdAt) }}
              </template>
            </template>
          </a-table>
        </a-card>
      </div>
    </a-spin>
  </div>

  <BackToTop />
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileWordOutlined } from '@ant-design/icons-vue'
import { getFinishedAssignments, queryEssayByShortId, type QueriedEssay as Essay } from '@/services/apiService'
import { formatDateUTC8 } from '@/composables/useDateFormat'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import BackToTop from '@/components/BackToTop.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

const queryMode = ref<'queryByShortId' | 'queryByStudentId'>('queryByShortId')

const errorMessage = ref('')
const shortId = ref('')
const studentId = ref('')
interface SubmissionsResponse {
  Student: {
    Id: string
    Name: string
    StudentId: string
  }
  Submissions: {
    Id: string
    EssayAssignmentId: string
    Title: string
    IsError: boolean
    Score: number
    FinalScore: number
    CreatedAt: string
  }[]
}

const finishedAssignments = ref<any[]>([])
const essay = ref<Essay | null>(null)
const loading = ref(false)
const error = ref('')
const exportingWord = ref(false)
const copyTooltipVisible = ref<string | null>(null)

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

const submissionColumns = [
  {
    title: '作文标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '提交时间',
    key: 'createdAt',
  },
  {
    title: '状态',
    key: 'status',
  },
  {
    title: '分数',
    key: 'finalScore',
  },
]

function getShortId(fullId: string): string {
  return fullId.slice(-8).toUpperCase()
}

async function copyShortId(fullId: string) {
  const shortId = getShortId(fullId)
  try {
    await navigator.clipboard.writeText(shortId)
    copyTooltipVisible.value = fullId
    setTimeout(() => {
      copyTooltipVisible.value = null
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
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

async function queryStudent() {
  if (!studentId.value || studentId.value.length !== 8) {
    error.value = '请输入有效的8位学生考号。'
    return
  }

  loading.value = true
  error.value = ''
  finishedAssignments.value = []

  try {
    const response = await getFinishedAssignments(studentId.value)
    console.log('API返回数据:', response)
    
    if (response && response.submissions && response.submissions.length > 0) {
      // 处理API返回的新数据结构 - 使用正确的字段名
      const submissionsWithStudentInfo = response.submissions.map((submission: any) => ({
        id: submission.id,
        title: submission.title,
        essayAssignmentId: submission.essayAssignmentId,
        isError: submission.isError,
        score: submission.score,
        finalScore: submission.finalScore,
        createdAt: submission.createdAt,
        student: {
          id: response.student.id,
          name: response.student.name,
          studentId: response.student.studentId
        }
      }))
      finishedAssignments.value = submissionsWithStudentInfo
      console.log('处理后的提交列表:', finishedAssignments.value)
    } else {
      error.value = '未找到对应的学生记录或该学生暂无提交。'
    }
  } catch (err: any) {
    console.error('查询失败:', err)
    error.value = err.response?.data?.message || '查询失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}
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
  // 不再从URL读取查询参数
})
</script>

<style scoped>
</style>
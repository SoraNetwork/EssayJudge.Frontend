<template>
  <v-btn 
    color="info" 
    :loading="exporting" 
    @click="exportToWord"
    v-bind="attrs"
  >
    <v-icon left>mdi-file-word</v-icon>
    导出Word
    <slot></slot>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import MarkdownIt from 'markdown-it'
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import type { Submission } from '@/services/apiService'
import { getSubmissionById } from '@/services/apiService'
import { Packer } from 'docx'


// 使用useAttrs获取传递给组件的所有属性
const attrs = useAttrs()

// 定义组件的属性
const props = defineProps<{
  essayId: string
  classInfo?: any
  buttonText?: string
}>()

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    return str
  }
})

const exporting = ref(false)

// 将Markdown文本转换为DOCX段落数组的函数
const convertMarkdownToParagraphs = (markdownText: string): Array<Paragraph | Table> => {
  // 将Markdown转换为HTML
  const html = md.render(markdownText)
  // 创建DOM解析器
  const parser = new DOMParser()
  // 解析HTML字符串为DOM文档
  const doc = parser.parseFromString(html, 'text/html')
  // 存储转换后的段落数组
  const elements: Array<Paragraph | Table> = []

  // 处理单个DOM节点的函数，返回对应的DOCX段落对象
  const processNode = (node: Element): Paragraph | Paragraph[] | Table => {
    switch (node.tagName.toLowerCase()) {
      // 处理一级标题
      case 'h1':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_1 })
      // 处理二级标题
      case 'h2':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_2 })
      // 处理三级标题
      case 'h3':
        return new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_3 })
      // 处理普通段落
      case 'p':
        return new Paragraph({ text: node.textContent || '' })
      // 处理引用块
      case 'blockquote':
        return new Paragraph({
          text: node.textContent || '',
          indent: { left: 720 },
          border: { left: { style: 'single', size: 12, color: '666666' } }
        })
      // 处理无序列表和有序列表
      case 'ul':
      case 'ol':
        return Array.from(node.children).map(li => 
          new Paragraph({
            text: li.textContent || '',
            bullet: { level: 0 }
          })
        )
      // 处理代码块
      case 'pre':
        return new Paragraph({
          text: node.textContent || '',
          spacing: { before: 240, after: 240 },
          shading: { type: 'solid', fill: 'F0F0F0' }
        })
      // 处理表格
      case 'table':
        const rows = Array.from(node.querySelectorAll('tr'))
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
            const cells = Array.from(row.querySelectorAll('th, td'))
            return new TableRow({
              children: cells.map(cell => {
                return new TableCell({
                  children: [new Paragraph(cell.textContent || '')],
                  verticalAlign: "center"
                })
              })
            })
          })
        })
      // 处理其他类型节点
      default:
        return new Paragraph({ text: node.textContent || '' })
    }
  }

  // 遍历处理所有根节点
  Array.from(doc.body.children).forEach(node => {
    const result = processNode(node)
    // 处理返回结果可能是数组的情况
    if (Array.isArray(result)) {
      elements.push(...result)
    } else {
      elements.push(result)
    }
  })

  return elements
}

// 导出为Word文档的主函数
const exportToWord = async () => {
  // 检查是否有作文ID
  if (!props.essayId) return
  
  // 设置导出状态为true
  exporting.value = true
  try {
    // 获取作文详细信息
    const essay: Submission = await getSubmissionById(props.essayId)
    
    // 创建Word文档对象
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: "20mm",
              right: "12.7mm",
              bottom: "20mm",
              left: "12.7mm"
            }
          }
        },
        children: [
          // 添加学生信息
          new Paragraph({
            children: [
              new TextRun({ text: "学生姓名：", bold: true }),
              new TextRun(essay.student?.name || "")
            ]
          }),
          // 添加班级信息
          new Paragraph({
            children: [
              new TextRun({ text: "班级：", bold: true }),
              new TextRun(props.classInfo?.name || "未分配班级")
            ]
          }),
          // 添加年级信息
          new Paragraph({
            children: [
              new TextRun({ text: "年级：", bold: true }),
              new TextRun(essay.essayAssignment?.grade || "")
            ]
          }),
          // 添加题目信息
          new Paragraph({
            children: [
              new TextRun({ text: "测验题目：", bold: true }),
              new TextRun(essay.essayAssignment?.titleContext || "")
            ]
          }),
          // 添加测验来源
          new Paragraph({
            children: [
              new TextRun({ text: "测验来源：", bold: true }),
              new TextRun(essay.essayAssignment?.description || "")
            ]
          }),
          // 添加得分信息
          new Paragraph({
            children: [
              new TextRun({ text: "得分：", bold: true }),
              new TextRun(essay.finalScore?.toString() || "")
            ]
          }),
          // 添加综合评判标题
          new Paragraph({
            text: "综合评判",
            heading: HeadingLevel.HEADING_2
          }),
          // 添加转换后的评判内容
          ...convertMarkdownToParagraphs(essay.judgeResult || ""),
          // 添加AI评分详情标题
          new Paragraph({
            text: "AI评分详情",
            heading: HeadingLevel.HEADING_2
          }),
          // 添加所有AI评分结果
          ...(essay.aiResults || []).map((result: any) => [
            new Paragraph({
              text: result.modelName,
              heading: HeadingLevel.HEADING_3
            }),
            new Paragraph(result.feedback),
            new Paragraph({
              children: [
                new TextRun({ text: "得分：", bold: true }),
                new TextRun(result.score?.toString() || "N/A")
              ]
            })
          ]).flat()
        ]
      }]
    })

// 将文档转换为Blob对象
const buffer = await Packer.toBlob(doc)

// 使用FileSaver保存文件
    saveAs(buffer, `${essay.title || '作文评分'}.docx`)
  } catch (error) {
    // 打印导出错误
    console.error('Word导出失败:', error)
  } finally {
    // 重置导出状态
    exporting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  exportToWord
})
</script>
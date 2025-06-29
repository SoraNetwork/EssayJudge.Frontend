<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">正在批量批改</span>
            <span class="text-subtitle-1">正在处理第 {{ currentEssayIndex + 1 }} 篇，共 {{ totalEssays }} 篇</span>
          </v-card-title>
          <v-progress-linear :model-value="progress" color="primary" height="6" striped></v-progress-linear>
          
          <v-divider></v-divider>

          <v-row no-gutters>
            <v-col cols="12" md="6">
              <v-card-text>
                <h3 class="text-h6 mb-2">当前作文图片</h3>
                <v-img
                  :src="currentEssay.imageUrl"
                  aspect-ratio="1"
                  class="grey lighten-2"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="grey lighten-5"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
              </v-card-text>
            </v-col>

            <v-divider vertical></v-divider>

            <v-col cols="12" md="6">
              <v-card-text>
                <h3 class="text-h6 mb-2">OCR 识别结果</h3>
                <v-sheet rounded="lg" class="pa-4" color="grey-lighten-3" min-height="150px">
                  <p class="text-body-1" style="white-space: pre-wrap;">{{ currentEssay.ocrText }}</p>
                </v-sheet>
              </v-card-text>
              <v-card-text>
                <h3 class="text-h6 mb-2">评分详情</h3>
                <v-sheet rounded="lg" class="pa-4" color="grey-lighten-3">
                  <div v-if="currentEssay.scoreDetails">
                    <p><strong>总分:</strong> {{ currentEssay.scoreDetails.score }} / {{ currentEssay.scoreDetails.total }}</p>
                    <p><strong>评语:</strong> {{ currentEssay.scoreDetails.feedback }}</p>
                  </div>
                   <div v-else class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <p class="mt-2">正在评分中...</p>
                  </div>
                </v-sheet>
              </v-card-text>
            </v-col>
          </v-row>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="elevated" @click="stopGrading">
              <v-icon left>mdi-stop-circle</v-icon>
              停止批改
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'

const router = useRouter()
const { showSnackbar } = useSnackbar()

const essaysToGrade = [
  {
    id: 1,
    studentName: '张三',
    submissionDate: '2024-10-26',
    imageUrl: 'https://picsum.photos/500/500?random=1',
    ocrText: '这是第一篇作文的识别文本内容。春天来了，万物复苏，小草从地下探出了头，柳树也抽出了新芽。公园里的花儿都开了，红的像火，粉的像霞，白的像雪。我和爸爸妈妈一起去公园放风筝，感受春天的气息。',
    scoreDetails: { 
      score: 85, 
      total: 100, 
      feedback: '内容充实，对春天的描写生动具体，情感真挚。语言表达流畅，但个别词语使用可以更精确。',
      breakdown: [
        { item: '内容与主题', score: 27, total: 30, comment: '紧扣主题，内容丰富。' },
        { item: '结构与逻辑', score: 28, total: 30, comment: '结构完整，层次清晰。' },
        { item: '语言与表达', score: 22, total: 30, comment: '语言流畅，但词汇量有待提高。' },
        { item: '书写与卷面', score: 8, total: 10, comment: '书写工整，卷面整洁。' },
      ]
    }
  },
  {
    id: 2,
    studentName: '李四',
    submissionDate: '2024-10-27',
    imageUrl: 'https://picsum.photos/500/500?random=2',
    ocrText: '这是第二篇作文的识别文本内容。我的梦想是成为一名科学家，探索宇宙的奥秘。我想知道星星为什么会发光，黑洞里面又是什么样子。为了实现这个梦想，我一定要努力学习，掌握更多的科学知识。',
    scoreDetails: { 
      score: 92, 
      total: 100, 
      feedback: '想象力丰富，立意新颖，展现了对科学的浓厚兴趣。逻辑性强，论述清晰。',
      breakdown: [
        { item: '内容与主题', score: 29, total: 30, comment: '立意高远，富有想象力。' },
        { item: '结构与逻辑', score: 29, total: 30, comment: '逻辑严密，条理清晰。' },
        { item: '语言与表达', score: 26, total: 30, comment: '表达准确，充满激情。' },
        { item: '书写与卷面', score: 8, total: 10, comment: '卷面干净。' },
      ]
    }
  },
  {
    id: 3,
    studentName: '王五',
    submissionDate: '2024-10-28',
    imageUrl: 'https://picsum.photos/500/500?random=3',
    ocrText: '这是第三篇作文的识别文本内容。记一次难忘的运动会，那天天气晴朗，我们班的运动员们都表现得非常出色，在4x100米接力赛中，我们团结协作，最终取得了第一名的好成绩。',
    scoreDetails: null
  },
    {
    id: 4,
    studentName: '赵六',
    submissionDate: '2024-10-29',
    imageUrl: 'https://picsum.photos/500/500?random=4',
    ocrText: '这是第四篇作文的识别文本内容。如何保护我们的地球，我认为我们应该从身边的小事做起，比如节约用水、垃圾分类等等。',
    scoreDetails: null
  }
]

const currentEssayIndex = ref(0)
const totalEssays = essaysToGrade.length
const currentEssay = computed(() => essaysToGrade[currentEssayIndex.value])
const progress = computed(() => ((currentEssayIndex.value + 1) / totalEssays) * 100)

let intervalId: number | null = null

const processNextEssay = () => {
  if (!essaysToGrade[currentEssayIndex.value].scoreDetails) {
     setTimeout(() => {
        essaysToGrade[currentEssayIndex.value].scoreDetails = {
            score: Math.floor(Math.random() * 20) + 75,
            total: 100,
            feedback: '批改完成，这是一条自动生成的评语。文章整体不错，但细节有待加强。',
            breakdown: [
              { item: '内容与主题', score: 25, total: 30, comment: '基本切题。' },
              { item: '结构与逻辑', score: 24, total: 30, comment: '结构尚可。' },
              { item: '语言与表达', score: 20, total: 30, comment: '语言表达有提升空间。' },
              { item: '书写与卷面', score: 7, total: 10, comment: '书写需要更工整。' },
            ]
        };
        moveToNext();
     }, 2000);
  } else {
      moveToNext();
  }
}

const moveToNext = () => {
    if (currentEssayIndex.value < totalEssays - 1) {
        currentEssayIndex.value++
    } else {
        stopGrading()
        showSnackbar('所有作文批改完成！')
        router.push({ name: 'GradingResults', state: { gradedEssays: essaysToGrade } })
    }
}

const startGrading = () => {
  intervalId = setInterval(processNextEssay, 4000)
}

const stopGrading = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
</script>

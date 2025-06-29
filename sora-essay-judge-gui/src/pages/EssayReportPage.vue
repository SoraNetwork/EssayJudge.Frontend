<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10">
        <v-card v-if="essay">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>作文智能评阅报告</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="router.back()">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </v-toolbar>

          <v-card-text>
            <!-- 学生信息 -->
            <v-row class="mb-4">
              <v-col>
                <div class="text-h6">学生姓名: {{ essay.studentName }}</div>
                <div class="text-subtitle-1 text-grey">提交日期: {{ essay.submissionDate }}</div>
              </v-col>
            </v-row>

            <v-row>
              <!-- 左侧：总览和评分细则 -->
              <v-col cols="12" md="5">
                <!-- 总分 -->
                <v-card variant="tonal" class="mb-4">
                  <v-card-text class="text-center">
                    <div class="text-subtitle-1 text-grey">综合得分</div>
                    <v-progress-circular
                      :model-value="(essay.scoreDetails.score / essay.scoreDetails.total) * 100"
                      :size="120"
                      :width="12"
                      color="primary"
                      class="my-4"
                    >
                      <span class="text-h4">{{ essay.scoreDetails.score }}</span>
                    </v-progress-circular>
                    <div class="text-h6">满分: {{ essay.scoreDetails.total }}</div>
                  </v-card-text>
                </v-card>

                <!-- 评分细则 -->
                <v-card variant="tonal">
                   <v-card-title>评分细则</v-card-title>
                   <v-list lines="two" density="compact">
                     <v-list-item
                       v-for="item in essay.scoreDetails.breakdown"
                       :key="item.item"
                       :title="item.item"
                       :subtitle="item.comment"
                     >
                       <template v-slot:append>
                         <v-chip color="primary" label>
                           {{ item.score }} / {{ item.total }}
                         </v-chip>
                       </template>
                     </v-list-item>
                   </v-list>
                </v-card>
              </v-col>

              <!-- 右侧：评语和原文 -->
              <v-col cols="12" md="7">
                <!-- 综合评语 -->
                <v-card variant="tonal" class="mb-4">
                  <v-card-title>综合评语</v-card-title>
                  <v-card-text>
                    <p>{{ essay.scoreDetails.feedback }}</p>
                  </v-card-text>
                </v-card>

                <!-- 原文图片和OCR文本 -->
                <v-card variant="tonal">
                  <v-tabs v-model="tab" bg-color="primary" grow>
                    <v-tab value="image">原文图片</v-tab>
                    <v-tab value="text">识别文本</v-tab>
                  </v-tabs>
                  <v-window v-model="tab">
                    <v-window-item value="image">
                      <v-img :src="essay.imageUrl" class="ma-2"></v-img>
                    </v-window-item>
                    <v-window-item value="text">
                      <v-card-text>
                        <p style="white-space: pre-wrap;">{{ essay.ocrText }}</p>
                      </v-card-text>
                    </v-window-item>
                  </v-window>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-alert v-else type="error">
          未找到作文报告，或数据已失效。请返回重试。
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const essay = ref(null)
const tab = ref('image')

onMounted(() => {
  const essayId = Number(route.params.id)
  // 注意：history.state 不是持久化的，刷新页面会丢失
  const gradedEssays = history.state.gradedEssays || []
  essay.value = gradedEssays.find(e => e.id === essayId)
})
</script>

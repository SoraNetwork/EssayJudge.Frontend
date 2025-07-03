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
              <p><strong>标题:</strong> {{ essay.title }}</p>
              <p><strong>学生:</strong> {{ essay.student?.name }}</p>
              <p><strong>班级:</strong> {{ essay.student?.class?.name ?? '未分配班级' }}</p>
              <p><strong>最终得分:</strong> {{ essay.finalScore }} / {{ essay.essayAssignment.totalScore }}</p>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-btn color="primary" block @click="imageDialog = true">查看原文图片</v-btn>
              <v-btn color="secondary" block class="mt-2" @click="openEditDialog">修改分数</v-btn>
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
                        <v-card-text style="white-space: normal">
              <div ref="previewElement" class="markdown-body"></div>
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
    <v-dialog v-model="editDialog" persistent max-width="500px">
      <v-card>
        <v-card-title>修改作文分数</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="editableScore"
            label="最终得分"
            type="number"
            :rules="[v => v !== null && v !== '' || '分数不能为空', v => v <= essay.essayAssignment.totalScore || `分数不能超过总分 ${essay.essayAssignment.totalScore}`]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="editDialog = false">取消</v-btn>
          <v-btn color="blue darken-1" text @click="updateScore">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import Vditor from 'vditor';
import 'vditor/dist/index.css';

const route = useRoute()
const essay = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null);
const imageDialog = ref(false);
const editDialog = ref(false);
const editableScore = ref<number | null>(null);

const previewElement = ref<HTMLElement | null>(null);

const renderMarkdown = (markdown: string) => {
  if (previewElement.value) {
    Vditor.preview(previewElement.value, markdown, {
      after: () => {
        // You can add any callbacks here if needed
      },
    });
  }
};

const fetchEssay = async () => {
  const id = route.params.id
  try {
        const response = await api.get(`/EssaySubmission/${id}`)
    essay.value = response.data
  } catch (err) {
    error.value = '加载作文失败，请稍后再试。'
    console.error(err)
  } finally {
    loading.value = false
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

watch(essay, (newEssay) => {
  if (newEssay?.judgeResult) {
    nextTick(() => {
      renderMarkdown(newEssay.judgeResult);
    });
  }
}, { deep: true });


const openEditDialog = () => {
  if (essay.value) {
    editableScore.value = essay.value.finalScore;
    editDialog.value = true;
  }
};

const updateScore = async () => {
  if (editableScore.value === null) return;
  const id = route.params.id;
  try {
    await api.put(`/api/EssaySubmissions/${id}/score`, { score: editableScore.value });
    editDialog.value = false;
    await fetchEssay(); // Refresh data
  } catch (err) {
    console.error('Failed to update score:', err);
    error.value = '更新分数失败。';
  }
};

onMounted(() => {
  fetchEssay();
});

</script>
<style>
@import 'github-markdown-css/github-markdown.css';

.v-card-text {
    white-space: pre-wrap;
    font-size: 1.2rem; /* 增加字体大小 */
    line-height: 1.8; /* 调整行间距 */
}

.markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
    padding: 25px;
    background-color: inherit !important;
    color: inherit !important;
}

/* Custom styles for vditor rendered content */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-size: 1.2rem !important;
  margin-top: 12px !important;
  margin-bottom: 8px !important;
}

.markdown-body p,
.markdown-body ul,
.markdown-body ol,
.markdown-body li {
  font-size: 1rem !important;
}

.markdown-body p {
    line-height: 1.6 !important;
}

/* Remove additional padding and margin from markdown-body if it's inside a v-card-text */
.v-card-text > .markdown-body {
    padding: 0;
    margin: 0;
}

/* Remove margin from the first and last elements inside the markdown body */
.markdown-body > :first-child {
    margin-top: 0 !important;
}

.markdown-body > :last-child {
    margin-bottom: 0 !important;
}
</style>
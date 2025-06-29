<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-title class="text-h5">
            作文批改设置
          </v-card-title>
          <v-card-subtitle>
            请填写以下参数以开始批改流程
          </v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          <v-card-text>
            <v-form ref="form">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="gradingParams.totalScore"
                    label="作文总分"
                    required
                    type="number"
                    prepend-icon="mdi-file-star"
                    :min="1"
                    step="1"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="gradingParams.benchmarkScore"
                    label="基准分"
                    required
                    type="number"
                    prepend-icon="mdi-target"
                    :min="1"
                    step="1"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-select
                v-model="gradingParams.grade"
                :items="['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三']"
                label="年级"
                required
                prepend-icon="mdi-account-school"
              ></v-select>
              <v-textarea
                v-model="gradingParams.background"
                label="题目背景"
                prepend-icon="mdi-text-box-outline"
                rows="3"
              ></v-textarea>
              <v-textarea
                v-model="gradingParams.criteria"
                label="评分标准"
                prepend-icon="mdi-format-list-checks"
                rows="3"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="elevated">
              <v-icon left>mdi-upload</v-icon>
              上传图片/扫描
            </v-btn>
            <v-btn color="secondary" variant="elevated" @click="handleStartBatchGrading">
              <v-icon left>mdi-play-circle</v-icon>
              开始批改
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'

const router = useRouter()
const { showSnackbar } = useSnackbar()
const form = ref(null)

const gradingParams = ref({
  totalScore: null,
  benchmarkScore: null,
  grade: null,
  background: '',
  criteria: '',
})

// 模拟全局项目列表
const projectList = ref([
  {
    id: 1,
    totalScore: 100,
    benchmarkScore: 60,
    grade: '三年级',
    background: '春天的公园',
    criteria: '内容、结构、语言、书写',
    essays: []
  }
  // ...可添加更多项目...
])

const handleStartBatchGrading = () => {
  // 检查参数完整性
  const params = gradingParams.value
  if (
    !params.totalScore ||
    !params.benchmarkScore ||
    !params.grade ||
    !params.background ||
    !params.criteria
  ) {
    showSnackbar('请填写所有批改参数', 'error')
    return
  }

  // 查找是否有完全一致的项目
  const found = projectList.value.find(p =>
    p.totalScore === Number(params.totalScore) &&
    p.benchmarkScore === Number(params.benchmarkScore) &&
    p.grade === params.grade &&
    p.background === params.background &&
    p.criteria === params.criteria
  )

  if (found) {
    // 归档作文到该项目（此处略，实际应有作文数据）
    showSnackbar('已归档到现有作文项目', 'success')
    router.push('/batch-grading')
  } else {
    // 新建项目并归档
    projectList.value.push({
      id: Date.now(),
      totalScore: Number(params.totalScore),
      benchmarkScore: Number(params.benchmarkScore),
      grade: params.grade,
      background: params.background,
      criteria: params.criteria,
      essays: [] // 实际应归档作文
    })
    showSnackbar('已新建作文项目', 'success')
    router.push('/batch-grading')
  }
}
</script>

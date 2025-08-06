<template>
  <div>
    <h1 class="text-h4 mb-4">查询作文提交状态</h1>

    <v-card>
      <v-card-text>
        <v-form @submit.prevent="queryEssay">
          <v-text-field
            v-model="shortId"
            label="输入8位作文ID进行查询"
            :rules="shortIdRules"
            maxlength="8"
            counter
            clearable
            class="mb-4"
          />
          <div class="d-flex justify-end">
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!shortId || shortId.length !== 8"
            >
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
          <v-list-item title="学生姓名" :subtitle="essay.studentName" />
          <v-list-item title="学号" :subtitle="essay.studentId" />
          <v-list-item title="提交时间" :subtitle="formatDate(essay.createdAt)" />
          <v-list-item title="状态" :subtitle="essay.status" />
          <v-list-item v-if="essay.score" title="得分" :subtitle="essay.score" />
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="goToEssayDetail">
          查看详情
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { queryEssayByShortId, type QueriedEssay as Essay } from '@/services/apiService'

const route = useRoute()
const router = useRouter()

const shortId = ref('')
const essay = ref<Essay | null>(null)
const loading = ref(false)
const error = ref('')

const shortIdRules = [
  (v: string) => !!v || '请输入ID',
  (v: string) => (v && v.length === 8) || 'ID必须是8位',
]

function goToEssayDetail() {
  if (essay.value) {
    router.push(`/essays/${essay.value.id}`)
  }
}

async function queryEssay() {
  if (!shortId.value || shortId.value.length !== 8) {
    error.value = '请输入有效的8位作文ID。'
    return
  }
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
    shortId.value = route.query.id
    queryEssay()
  }
})

watch(() => route.query.id, (newId) => {
  if (newId && typeof newId === 'string' && newId !== shortId.value) {
    shortId.value = newId
    queryEssay()
  }
})
</script>

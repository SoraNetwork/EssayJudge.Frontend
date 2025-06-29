<template>
  <v-container fluid>
    <v-row>
      <!-- 左侧：最近批改的作文 -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title>
            <span>最近批改的作文</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              placeholder="搜索作文"
              prepend-inner-icon="mdi-magnify"
              dense
              hide-details
              style="max-width: 220px;"
            ></v-text-field>
          </v-card-title>
          <v-divider></v-divider>
          <v-list>
            <v-list-item
              v-for="essay in filteredEssays"
              :key="essay.id"
              @click="goToEssayDetail(essay.id)"
              style="cursor:pointer"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ essay.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  学生：{{ essay.studentName }}　|　批改时间：{{ essay.time }}　|　测验：{{ essay.assignmentName }}　|　建议分数：{{ essay.suggestedScore }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div v-if="!filteredEssays.length" class="text-center text-grey mt-2">
              暂无作文
            </div>
          </v-list>
        </v-card>
      </v-col>

      <!-- 右侧：用户信息与最近作文测验 -->
      <v-col cols="12" md="5">
        <v-card class="mb-4" style="min-height: 140px;">
          <v-card-text class="d-flex flex-row align-center">
            <div class="flex-grow-0 mr-4">
              <v-avatar size="64">
                <v-img :src="user.avatar" />
              </v-avatar>
            </div>
            <div class="flex-grow-1">
              <div class="text-grey text-caption mb-1">{{ today }}</div>
              <div class="text-h6">{{ user.name }}</div>
              <div class="text-body-2 mt-1">{{ user.class }}</div>
            </div>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            最近作文测验
          </v-card-title>
          <v-divider></v-divider>
          <v-list>
            <v-list-item
              v-for="assignment in assignments"
              :key="assignment.id"
              @click="goToAssignmentDetail(assignment.id)"
              style="cursor:pointer"
            >
              <v-list-item-content>
                <v-list-item-title>{{ assignment.title }}</v-list-item-title>
                <v-list-item-subtitle>测验时间：{{ assignment.time }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div v-if="!assignments.length" class="text-center text-grey mt-2">
              暂无作文测验
            </div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref({
  name: '张老师',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  grade: '高一',
  class: '12班'
})

const today = new Date().toISOString().slice(0, 10)

const assignments = ref<any[]>([
  { id: '1', title: '高一月考作文', time: '2024-06-10' },
  { id: '2', title: '环保主题写作', time: '2024-06-05' },
  { id: '3', title: '科技与生活', time: '2024-06-01' }
])
const essays = ref<any[]>([
  { id: '101', title: '春天的公园', studentName: '李明', time: '2024-06-10', assignmentName: '高一月考作文', suggestedScore: 88 },
  { id: '102', title: '我的梦想', studentName: '王芳', time: '2024-06-09', assignmentName: '环保主题写作', suggestedScore: 92 },
  { id: '103', title: '难忘的一天', studentName: '张伟', time: '2024-06-08', assignmentName: '科技与生活', suggestedScore: 85 }
])
const search = ref('')

const filteredEssays = computed(() => {
  if (!search.value) return essays.value
  return essays.value.filter(e =>
    e.title.includes(search.value) ||
    e.studentName.includes(search.value) ||
    e.assignmentName.includes(search.value)
  )
})

const goToAssignmentDetail = (id: string) => {
  router.push(`/assignment/${id}`)
}
const goToEssayDetail = (id: string) => {
  router.push(`/essay/${id}`)
}
</script>

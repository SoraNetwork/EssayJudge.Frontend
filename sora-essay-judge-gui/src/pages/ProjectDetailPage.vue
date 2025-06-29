<template>
  <v-container>
    <v-app-bar flat>
      <div style="position: relative; width: 100%;">
        <div style="position: relative;">
          <v-text-field
            v-if="editingTitle"
            v-model="editTitleValue"
            hide-details
            single-line
            autofocus
            :style="`display:inline-block; padding-right:90px; width:${Math.max(120, editTitleValue.length * 18)}px;`"
          ></v-text-field>
          <v-text-field
            v-else
            :model-value="project.title"
            hide-details
            single-line
            readonly
            :style="`display:inline-block; padding-right:40px; width:${Math.max(120, project.title.length * 18)}px;`"
          ></v-text-field>
          <div style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <template v-if="editingTitle">
              <v-btn icon size="small" color="primary" @click="confirmEditTitle">
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn icon size="small" color="grey" @click="cancelEditTitle">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-btn icon size="small" @click="startEditTitle">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <v-btn icon color="error" class="ml-2" @click="dialogDelete = true">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </v-app-bar>

    <v-divider class="mb-4"></v-divider>

    <v-card class="mb-4">
      <v-card-title>
        作文题目
      </v-card-title>
      <v-card-text>
        <div style="position: relative;">
          <v-text-field
            v-if="editingTopic"
            v-model="editTopicValue"
            hide-details
            single-line
            autofocus
            style="padding-right: 90px;"
          ></v-text-field>
          <v-text-field
            v-else
            :model-value="project.topic"
            hide-details
            single-line
            readonly
            style="padding-right: 40px;"
          ></v-text-field>
          <div style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <template v-if="editingTopic">
              <v-btn icon size="small" color="primary" @click="confirmEditTopic">
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn icon size="small" color="grey" @click="cancelEditTopic">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-btn icon size="small" @click="startEditTopic">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>项目内作文</v-card-title>
      <v-card-text style="max-height: 350px; overflow-y: auto;">
        <v-data-table
          :headers="essayHeaders"
          :items="project.essays"
          item-value="id"
          class="elevation-1"
          :items-per-page="5"
          @click:row="goToEssayDetail"
          style="cursor:pointer"
        >
          <template #item.title="{ item }">
            <span class="font-weight-bold">{{ item.title }}</span>
          </template>
          <template #item.length="{ item }">
            {{ item.length }} 字
          </template>
          <template #item.score="{ item }">
            <v-chip color="primary" label>{{ item.score }}</v-chip>
          </template>
        </v-data-table>
        <div v-if="!project.essays.length" class="text-center text-grey mt-4">
          暂无作文
        </div>
      </v-card-text>
    </v-card>

    <!-- 删除确认弹窗 -->
    <v-dialog v-model="dialogDelete" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确定要删除该作文项目吗？此操作不可恢复。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="dialogDelete = false">取消</v-btn>
          <v-btn color="error" @click="deleteProject">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'

// 模拟获取项目数据
const route = useRoute()
const router = useRouter()
const { showSnackbar } = useSnackbar()

const projectId = Number(route.params.id)
const allProjects = [
  {
    id: 1,
    title: '作文2024-06-10',
    createdAt: '2024-06-10 09:30',
    essayCount: 3,
    essays: [
      { id: 1, title: '春天的公园', length: 350, time: '2024-06-10 10:00', score: 88 },
      { id: 2, title: '我的梦想', length: 420, time: '2024-06-10 10:30', score: 92 },
      { id: 3, title: '难忘的一天', length: 390, time: '2024-06-10 11:00', score: 85 }
    ],
    topic: '春天的公园'
  },
  {
    id: 2,
    title: '作文2024-06-09',
    createdAt: '2024-06-09 14:20',
    essayCount: 2,
    essays: [
      { id: 4, title: '科技与生活', length: 400, time: '2024-06-09 15:00', score: 90 },
      { id: 5, title: '我的家乡', length: 380, time: '2024-06-09 15:30', score: 87 }
    ],
    topic: '科技与生活'
  }
]
const project = ref(allProjects.find(p => p.id === projectId) || allProjects[0])

const essayHeaders = [
  { title: '作文标题', key: 'title', align: 'start' as const },
  { title: '长度', key: 'length', align: 'end' as const },
  { title: '批改时间', key: 'time', align: 'center' as const },
  { title: '分数', key: 'score', align: 'end' as const }
]

const editingTitle = ref(false)
const editingTopic = ref(false)
const editTopicValue = ref(project.value.topic)
const editTitleValue = ref(project.value.title)

const startEditTopic = () => {
  editTopicValue.value = project.value.topic
  editingTopic.value = true
}
const confirmEditTopic = () => {
  project.value.topic = editTopicValue.value
  editingTopic.value = false
}
const cancelEditTopic = () => {
  editingTopic.value = false
}

const startEditTitle = () => {
  editTitleValue.value = project.value.title
  editingTitle.value = true
}
const confirmEditTitle = () => {
  project.value.title = editTitleValue.value
  editingTitle.value = false
}
const cancelEditTitle = () => {
  editingTitle.value = false
}

const showEditTopic = ref(false)
const dialogDelete = ref(false)

const goToEssayDetail = (event: any, { item }: any) => {
  router.push({ name: 'EssayReport', params: { id: item.id }, state: { gradedEssays: project.value.essays } })
}

const deleteProject = () => {
  dialogDelete.value = false
  showSnackbar('项目删除成功', 'success')
  router.push('/')
}
</script>

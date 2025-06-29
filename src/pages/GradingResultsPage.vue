<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-title class="text-h5">
            批改结果
          </v-card-title>
          <v-card-subtitle>
            共 {{ gradedEssays.length }} 篇作文已完成批改
          </v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="gradedEssays"
              item-value="id"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn color="primary" variant="tonal" @click="viewReport(item.id)">
                  查看报告
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const gradedEssays = ref([])

const headers = [
  { title: '作文ID', key: 'id', align: 'start' },
  { title: '得分', key: 'scoreDetails.score', align: 'end' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

onMounted(() => {
  if (history.state.gradedEssays) {
    gradedEssays.value = history.state.gradedEssays
  } else {
    // 如果没有数据，可以跳转回首页或显示提示
    router.push('/')
  }
})

const viewReport = (essayId: number) => {
  router.push({ name: 'EssayReport', params: { id: essayId } })
}
</script>

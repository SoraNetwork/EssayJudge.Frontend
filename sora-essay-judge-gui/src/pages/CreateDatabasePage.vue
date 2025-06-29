<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-title class="text-h5">
            创建新的班级数据库
          </v-card-title>
          <v-card-subtitle>
            请上传班级名单并填写相关信息
          </v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          <v-card-text>
            <v-form ref="form">
              <v-text-field
                v-model="dbInfo.schoolName"
                label="学校名称"
                prepend-icon="mdi-school"
                required
              ></v-text-field>
              <v-text-field
                v-model="dbInfo.className"
                label="班级名称"
                prepend-icon="mdi-google-classroom"
                required
              ></v-text-field>
              <v-file-input
                v-model="dbInfo.rosterFile"
                label="上传班级名单 (Excel/CSV)"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                prepend-icon="mdi-file-upload"
                required
              ></v-file-input>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" @click="router.back()">取消</v-btn>
            <v-btn color="primary" variant="elevated" @click="createDatabase">
              <v-icon left>mdi-database-plus</v-icon>
              创建
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

const dbInfo = ref({
  schoolName: '',
  className: '',
  rosterFile: [],
})

const createDatabase = () => {
  // 在这里添加实际的数据库创建和文件处理逻辑
  // 成功后可以跳转到首页
  showSnackbar(`数据库为 ${dbInfo.value.schoolName} - ${dbInfo.value.className} 创建成功！`)
  router.push('/')
}
</script>

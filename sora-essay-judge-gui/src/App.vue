<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="mr-6">
        <span>SoraEssayJudge</span>
      </v-toolbar-title>
      <v-btn
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        :color="isActive(item.to) ? 'primary' : undefined"
        variant="text"
        class="mx-1"
        exact
      >
        {{ item.label }}
      </v-btn>
      <v-spacer></v-spacer>
      <v-avatar size="36" class="mr-2">
        <v-img :src="user.avatar" />
      </v-avatar>
      <v-btn variant="text" class="font-weight-bold" @click="goToUser" style="text-transform:none;">
        {{ user.name }}
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-footer app>
      <span>&copy; 2024 SoraEssayJudge</span>
    </v-footer>

    <global-snackbar />
  </v-app>
</template>

<script lang="ts" setup>
  import GlobalSnackbar from '@/components/GlobalSnackbar.vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ref } from 'vue'

  const router = useRouter()
  const route = useRoute()

  const navItems = [
    { name: 'home', label: '主界面', to: '/' },
    { name: 'assignment', label: '测验管理', to: '/assignment' },
    { name: 'student', label: '学生管理', to: '/student' },
    { name: 'essay', label: '作文管理', to: '/essay' }
  ]

  const user = ref({
    name: '张老师',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  })

  const isActive = (to: string) => {
    if (to === '/') return route.path === '/'
    return route.path.startsWith(to)
  }

  const goToUser = () => {
    router.push('/user')
  }
</script>

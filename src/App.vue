<template>
  <v-app>
    <router-view />

    <v-overlay
      v-model="appStore.loading"
      class="align-center justify-center"
      persistent
      :scrim="scrimColor"
    >
    </v-overlay>
  </v-app>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/stores/app'
import { useTheme } from 'vuetify'
import { computed } from 'vue'

const appStore = useAppStore()
const theme = useTheme()

const scrimColor = computed(() => {
  return theme.global.current.value.dark
    ? 'rgba(255, 255, 255, 0.7)' // 深色模式用半透明白色
    : 'rgba(0, 0, 0, 0.7)'      // 亮色模式用半透明黑色
})
</script>

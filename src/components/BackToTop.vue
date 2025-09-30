<template>
  <v-fade-transition>
    <v-btn
      v-show="showButton"
      fab
      size="large"
      icon="mdi-arrow-up"
      class="back-to-top"
      @click="scrollToTop"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      v-tooltip="hoverText"
    >
    </v-btn>
  </v-fade-transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showButton = ref(false)
// 添加悬停文本和定时器引用
const hoverText = ref('')
const hoverTimer = ref<number | null>(null)

const handleScroll = () => {
  showButton.value = window.scrollY > 200
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 添加鼠标进入事件处理函数
const handleMouseEnter = () => {
  hoverTimer.value = window.setTimeout(() => {
    hoverText.value = '返回到顶部'
  }, 0)
}

// 添加鼠标离开事件处理函数
const handleMouseLeave = () => {
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
  // 延迟清空文本，确保tooltip完全隐藏
  setTimeout(() => {
    hoverText.value = ''
  }, 250)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  // 清理定时器
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
  }
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  background-color: rgba(25, 118, 210, 0.6) !important; /* 半透明蓝色背景 */
  color: white !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.back-to-top:hover {
  background-color: rgba(25, 118, 210, 0.9) !important; /* 悬停时增加不透明度 */
  transform: scale(1.00);
  transition: all 0.3s ease;
}
</style>
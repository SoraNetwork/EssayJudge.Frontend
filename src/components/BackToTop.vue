<template>
  <a-float-button
    v-show="showButton"
    :style="{ right: '30px', bottom: '30px' }"
    @click="scrollToTop"
  >
    <template #icon>
      <ArrowUpOutlined />
    </template>
  </a-float-button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUpOutlined } from '@ant-design/icons-vue'

const showButton = ref(false)

const handleScroll = () => {
  showButton.value = window.scrollY > 200
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
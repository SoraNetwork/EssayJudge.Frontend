<template>
  <div v-if="isMobileDevice" class="orientation-overlay">
    <div class="overlay-content">
      <img src="/rotation.gif" alt="旋转设备" class="rotation-gif" />
      <p class="message">请在横屏模式下使用</p>
      <p class="hint">旋转设备以继续</p>
          <a-button type="default" @click="isMobileDevice = false" style="margin-top: 20px;">在竖屏状态下继续</a-button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isMobileDevice = ref(false)

// 仅在挂载时判断一次是否为移动设备
// 这样可以确保 PC 端用户即便缩小浏览器窗口也不会触发遮罩
onMounted(() => {
  const ua = navigator.userAgent
  isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
})
</script>

<style scoped>
/* 1. 基础样式：默认隐藏 */
.orientation-overlay {
  display: none; 
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9); /* 稍深一点，增强沉浸感 */
  z-index: 9999;
  justify-content: center;
  align-items: center;
  /* 确保遮罩在所有元素最上层 */
  pointer-events: all;
}

/* 2. 核心逻辑：利用媒体查询检测竖屏状态 */
/* 当屏幕宽度小于高度（竖屏）时，显示遮罩 */
@media screen and (orientation: portrait) {
  .orientation-overlay {
    display: flex;
  }
}

/* 3. 内容样式 */
.overlay-content {
  text-align: center;
  color: white;
  padding: 20px;
}

.message {
  font-size: 24px;
  font-weight: bold;
  margin-top: 20px;
  letter-spacing: 1px;
}

.hint {
  font-size: 16px;
  margin-top: 10px;
  opacity: 0.7;
}

.rotation-gif {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

/* 针对一些特殊折叠屏设备的优化：
   如果屏幕非常窄，通常也认为是需要旋转的状态 */
@media screen and (max-width: 450px) {
  .message {
    font-size: 20px;
  }
}
</style>
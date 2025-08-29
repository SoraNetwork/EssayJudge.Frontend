<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="text-center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-8" elevation="4">
          <v-icon size="100" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
          <h1 class="text-h1 font-weight-bold text-primary">404</h1>
          <h2 class="text-h4 my-4">有这个页面吗？</h2>
          <p class="text-medium-emphasis mb-8">
            抱歉，您正在寻找的页面不存在或已被移动，请检查统一资源定位器输入是否正确。
          </p>
          <v-btn color="primary" to="/" size="large" prepend-icon="mdi-home">
            返回首页
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <BackToTop />
</template>

<script setup lang="ts">
// 此页面不需要特定的脚本逻辑
</script>

<style scoped>
.fill-height {
  min-height: 80vh;
}
</style>

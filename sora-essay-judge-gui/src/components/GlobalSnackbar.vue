<template>
  <v-snackbar
    v-model="snackbarState.show"
    :color="snackbarState.color"
    :timeout="snackbarState.timeout"
    location="top right"
    variant="elevated"
  >
    {{ snackbarState.text }}
    <template v-slot:actions>
      <v-btn icon @click="snackbarState.show = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useSnackbar } from '@/composables/useSnackbar'

const { snackbarState } = useSnackbar()
</script>

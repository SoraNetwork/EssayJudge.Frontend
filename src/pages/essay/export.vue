<template>
  <v-container>
    <v-card>
      <v-card-title>作文评分报告导出</v-card-title>
      <v-card-subtitle>导出作文评分结果为 Excel 文件</v-card-subtitle>
      
      <v-card-text>
        <v-form @submit.prevent="exportEssays">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedAssignmentId"
                :items="assignments"
                item-title="title"
                item-value="id"
                label="选择作文测验"
                clearable
                density="compact"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.description" />
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedAssignmentIds"
                :items="assignments"
                item-title="title"
                item-value="id"
                label="选择多个作文测验"
                multiple
                clearable
                density="compact"
                chips
                closable-chips
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.description" />
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedClassId"
                :items="classes"
                item-title="name"
                item-value="id"
                label="选择班级"
                clearable
                density="compact"
              />
            </v-col>
            
            <v-col cols="12" md="3">
              <v-text-field
                v-model="startDate"
                label="开始日期"
                type="date"
                density="compact"
              />
            </v-col>
            
            <v-col cols="12" md="3">
              <v-text-field
                v-model="endDate"
                label="结束日期"
                type="date"
                density="compact"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-btn type="submit" color="primary" :loading="loading" :disabled="!canExport">
                <v-icon start>mdi-download</v-icon>
                导出 Excel
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  getAssignments, 
  getClasses, 
  exportEssaySubmissions
} from '@/services/apiService';
import type { Assignment, Class, ExportFilterDto } from '@/services/apiService';

const selectedAssignmentId = ref<string | null>(null);
const selectedAssignmentIds = ref<string[]>([]);
const selectedClassId = ref<string | null>(null);
const startDate = ref<string>('');
const endDate = ref<string>('');
const loading = ref(false);

const assignments = ref<Assignment[]>([]);
const classes = ref<Class[]>([]);

const canExport = computed(() => {
  return selectedAssignmentId.value || 
         selectedAssignmentIds.value.length > 0 || 
         selectedClassId.value || 
         startDate.value || 
         endDate.value;
});

onMounted(async () => {
  try {
    assignments.value = await getAssignments();
    classes.value = await getClasses();
  } catch (error) {
    console.error('获取数据失败:', error);
  }
});

const exportEssays = async () => {
  if (!canExport.value) return;
  
  loading.value = true;
  
  try {
    const filter: ExportFilterDto = {
      essayAssignmentId: selectedAssignmentId.value || undefined,
      essayAssignmentIds: selectedAssignmentIds.value.length > 0 ? selectedAssignmentIds.value : undefined,
      classId: selectedClassId.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    };
    
    const blob = await exportEssaySubmissions(filter);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `作文评分报告_${new Date().toISOString().slice(0, 19)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>
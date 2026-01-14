<template>
  <div class="export-container">
    <a-card>
      <template #title>
        <span>作文评分报告导出</span>
      </template>
      <template #extra>
        <span class="text-secondary">导出作文评分结果为 Excel 文件</span>
      </template>

      <a-form @finish="exportEssays" layout="vertical">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="12">
            <a-form-item label="选择作文测验（支持多选）">
              <a-select
                v-model:value="selectedAssignmentIds"
                mode="multiple"
                placeholder="请选择作文测验"
                :options="assignmentOptions"
                :loading="loadingAssignments"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="选择班级">
              <a-select
                v-model:value="selectedClassId"
                placeholder="请选择班级"
                :options="classOptions"
                :loading="loadingClasses"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="开始日期">
              <a-date-picker
                v-model:value="startDate"
                placeholder="请选择开始日期"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="结束日期">
              <a-date-picker
                v-model:value="endDate"
                placeholder="请选择结束日期"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            :disabled="!canExport"
          >
            <template #icon>
              <DownloadOutlined />
            </template>
            导出 Excel
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { DownloadOutlined } from '@ant-design/icons-vue';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  getAssignments,
  getClasses,
  exportEssaySubmissions
} from '@/services/apiService';
import { formatDateUTC8 } from '@/utils/dateUtils';
import type { Assignment, Class, ExportFilterDto } from '@/services/apiService';

const selectedAssignmentIds = ref<string[]>([]);
const selectedClassId = ref<string | null>(null);
const startDate = ref<Dayjs | null>(null);
const endDate = ref<Dayjs | null>(null);
const loading = ref(false);
const loadingAssignments = ref(false);
const loadingClasses = ref(false);

const assignments = ref<Assignment[]>([]);
const classes = ref<Class[]>([]);

const assignmentOptions = computed(() => {
  return assignments.value.map(item => ({
    label: item.description || item.titleContext || item.id,
    value: item.id,
    createdAt: item.createdAt
  }));
});

const classOptions = computed(() => {
  return classes.value.map(item => ({
    label: item.name,
    value: item.id
  }));
});

const canExport = computed(() => {
  return selectedAssignmentIds.value.length > 0 ||
         selectedClassId.value ||
         startDate.value ||
         endDate.value;
});

onMounted(async () => {
  try {
    loadingAssignments.value = true;
    loadingClasses.value = true;
    const [assignmentsData, classesData] = await Promise.all([
      getAssignments(),
      getClasses()
    ]);
    assignments.value = assignmentsData || [];
    classes.value = classesData || [];
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loadingAssignments.value = false;
    loadingClasses.value = false;
  }
});

const exportEssays = async () => {
  if (!canExport.value) return;

  loading.value = true;

  try {
    const filter: ExportFilterDto = {
      essayAssignmentIds: selectedAssignmentIds.value.length > 0 ? selectedAssignmentIds.value : undefined,
      classId: selectedClassId.value || undefined,
      startDate: startDate.value ? startDate.value.format('YYYY-MM-DD') : undefined,
      endDate: endDate.value ? endDate.value.format('YYYY-MM-DD') : undefined
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

<style scoped>
.export-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.text-secondary {
  color: var(--ant-color-text-secondary);
  font-size: 14px;
}
</style>
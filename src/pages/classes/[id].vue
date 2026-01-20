<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold">班级详情: {{ classInfo?.name }}</h1>
      <div>
        <a-button type="primary" @click="openAddStudentDialog" style="margin-bottom: 8px;margin-right: 8px">
          <template #icon><PlusOutlined /></template>
          添加学生
        </a-button>
        <a-button class="ml-2" :href="'/classes'" style="margin-bottom: 8px;">
          <template #icon><ArrowLeftOutlined /></template>
          返回班级列表
        </a-button>
      </div>
    </div>

    <!-- 学生列表 -->
    <a-card>
      <template #title>学生列表 ({{ students.length }} 人)</template>
      <div class="responsive-table-container">
        <!-- 桌面端表格 -->
        <a-table
          v-if="display.mdAndUp.value"
          :columns="columns"
          :data-source="students"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :custom-row="(record, index) => ({ index })"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actions'">
              <a-tooltip title="删除学生">
                <a-button type="text" size="small" danger @click="confirmDelete(record)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </template>
          </template>
        </a-table>

        <!-- 移动端列表 -->
        <a-list v-else :data-source="students" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item class="mb-2">
              <a-list-item-meta>
                <template #title>{{ item.name }}</template>
                <template #description>{{ item.studentId }}</template>
              </a-list-item-meta>
              <template #actions>
                <a-button type="text" size="small" danger @click="confirmDelete(item)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-card>

    <!-- 添加学生对话框 -->
    <a-modal
      v-model:open="dialog"
      title="添加学生"
      :confirm-loading="adding"
      @ok="addStudent"
      @cancel="closeDialog"
      width="500px"
    >
      <a-form ref="form" :model="newStudent" layout="vertical">
        <a-form-item
          label="姓名*"
          name="name"
          :rules="nameRules"
        >
          <a-input v-model:value="newStudent.name" />
        </a-form-item>
        <a-form-item
          label="学号*"
          name="studentId"
          :rules="studentIdRules"
        >
          <a-input v-model:value="newStudent.studentId" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteDialog"
      title="确认删除"
      :confirm-loading="deleting"
      @ok="deleteStudent"
      @cancel="deleteDialog = false"
    >
      <p>确定要删除学生 <strong>{{ studentToDelete?.name }}</strong> 吗？此操作不可撤销。</p>
    </a-modal>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { PlusOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { getStudents, deleteStudent as apiDeleteStudent, getClasses, createStudent, type Student } from '@/services/apiService';

// Responsive display detection (Vuetify-independent)
const windowWidth = ref(window.innerWidth)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const display = computed(() => ({
  mdAndUp: { value: windowWidth.value >= 768 }
}))

// 定义班级和学生类型
interface ClassInfo {
  id: string;
  name: string;
}

// 表格列定义
const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'studentId', key: 'studentId' },
  { title: '操作', key: 'actions' }
];

// Vue Router
const route = useRoute();
const classId = (route.params as { id: string }).id;

// 数据和状态
const dialog = ref(false); // 添加/编辑对话框
const adding = ref(false);
const classInfo = ref<ClassInfo | null>(null);
const students = ref<Student[]>([]);
const loading = ref(false);
const deleteDialog = ref(false);
const studentToDelete = ref<Student | null>(null);
const deleting = ref(false);

// 新学生表单数据
const newStudent = ref({
  name: '',
  studentId: ''
});

// 表单 ref
const form = ref();

// 表单验证规则
const nameRules = [
  { required: true, message: '姓名是必填项' },
  { max: 50, message: '姓名不能超过50个字符' }
];

const studentIdRules = [
  { required: true, message: '学号是必填项' },
  { max: 20, message: '学号不能超过20个字符' }
];

// 获取班级详情
async function fetchClassDetails() {
  try {
    const allClasses = await getClasses();
    const foundClass = allClasses.find(c => c.id === classId);
    if (foundClass) {
      classInfo.value = foundClass;
    } else {
      console.error('未找到班级');
    }
  } catch (error) {
    console.error('获取班级详情失败:', error);
  }
}

// 获取班级下的学生
async function fetchStudents() {
  if (!classId) return;
  loading.value = true;
  try {
    const data = await getStudents({ classId: classId });
    students.value = data || [];
  } catch (error) {
    console.error('获取学生列表失败:', error);
  } finally {
    loading.value = false;
  }
}

// 打开添加学生对话框
function openAddStudentDialog() {
  dialog.value = true;
}

// 关闭对话框并重置表单
function closeDialog() {
  dialog.value = false;
  newStudent.value = {
    name: '',
    studentId: ''
  };
}

// 添加学生
async function addStudent() {
  try {
    await form.value.validate();
  } catch (error) {
    return;
  }

  adding.value = true;
  try {
    await createStudent({
      ...newStudent.value,
      classId: classId
    });
    closeDialog();
    await fetchStudents(); // 刷新列表
  } catch (error) {
    console.error('添加学生失败:', error);
  } finally {
    adding.value = false;
  }
}

// 确认删除
function confirmDelete(item: Student) {
  studentToDelete.value = item;
  deleteDialog.value = true;
}

// 删除学生
async function deleteStudent() {
  if (!studentToDelete.value) return;

  deleting.value = true;
  try {
    await apiDeleteStudent(studentToDelete.value.id);
    deleteDialog.value = false;
    studentToDelete.value = null;
    await fetchStudents(); // 刷新列表
  } catch (error) {
    console.error('删除学生失败:', error);
  } finally {
    deleting.value = false;
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchClassDetails();
  fetchStudents();
});
</script>

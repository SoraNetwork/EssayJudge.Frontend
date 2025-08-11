<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">班级详情: {{ classInfo?.name }}</h1>
      <div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddStudentDialog">添加学生</v-btn>
        <v-btn to="/classes" prepend-icon="mdi-arrow-left" class="ml-2">返回班级列表</v-btn>
      </div>
    </div>

    <!-- 学生列表 -->
    <v-card>
      <v-card-title>
        学生列表 ({{ students.length }} 人)
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="students"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="该班级下暂无学生"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">删除学生</v-tooltip>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 添加学生对话框 -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">添加学生</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="newStudent.name"
              label="姓名*"
              required
              :rules="nameRules"
            ></v-text-field>
            <v-text-field
              v-model="newStudent.studentId"
              label="学号*"
              required
              :rules="studentIdRules"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="addStudent" :loading="adding" :disabled="!valid">添加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>确定要删除学生 <strong>{{ studentToDelete?.name }}</strong> 吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteStudent" :loading="deleting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getStudents, deleteStudent as apiDeleteStudent, getClasses, createStudent, type Student } from '@/services/apiService';

// 定义班级和学生类型
interface ClassInfo {
  id: string;
  name: string;
}

// 表格列定义
const headers = [
  { title: '姓名', key: 'name' },
  { title: '学号', key: 'studentId' },
  { title: '操作', key: 'actions', sortable: false }
];

// Vue Router
const route = useRoute();
const classId = (route.params as { id: string }).id;

// 数据和状态
const dialog = ref(false); // 添加/编辑对话框
const valid = ref(false);
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

// 表单验证规则
const nameRules = [
  (v: string) => !!v || '姓名是必填项',
  (v: string) => v.length <= 50 || '姓名不能超过50个字符'
];

const studentIdRules = [
  (v: string) => !!v || '学号是必填项',
  (v: string) => v.length <= 20 || '学号不能超过20个字符'
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
  valid.value = false;
}

// 添加学生
async function addStudent() {
  if (!valid.value) return;
  
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
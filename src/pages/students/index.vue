<template>
  <div class="students-container">
    <div class="header-section mb-4" style="display: flex; justify-content: space-between; align-items: center;">
      <a-typography-title :level="2" class="mb-0">学生管理</a-typography-title>
      <div>
        <a-button type="default" @click="importDialog = true" class="mr-2">
          <template #icon>
            <UploadOutlined />
          </template>
          导入学生
        </a-button>
        <a-button type="primary" @click="dialog = true">
          <template #icon>
            <PlusOutlined />
          </template>
          添加学生
        </a-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <a-card class="mb-4" :body-style="{ padding: '16px' }">
      <a-row :gutter="[16, 16]">
        <a-col :span="24" :md="8">
          <a-select
            v-model:value="filters.classId"
            placeholder="选择班级"
            :options="classOptions"
            allow-clear
            style="width: 100%;"
            @change="fetchStudents"
          />
        </a-col>
        <a-col :span="24" :md="8">
          <a-input-search
            v-model:value="filters.searchTerm"
            placeholder="按姓名搜索学生"
            @search="handleSearch"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input-search>
        </a-col>
        <a-col :span="24" :md="8">
          <a-button type="primary" @click="fetchStudents" :loading="loading">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 学生列表 -->
    <a-card>
      <a-table :columns="columns" 
      :data-source="filteredStudents" 
      :loading="loading" 
      row-key="id" 
      :pagination="{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: any) => `共 ${total} 条`
      }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" type="primary" @click="editStudent(record)">编辑</a-button>
              <a-button size="small" type="primary" danger @click="confirmDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    <!-- 新建/编辑学生对话框 -->
    <a-modal
      v-model:open="dialog"
      :title="isEditing ? '编辑学生' : '添加学生'"
      @ok="saveStudent"
      :confirm-loading="saving"
      :width="600"
    >
      <a-form :model="editedItem" layout="vertical" ref="formRef">
        <a-form-item label="姓名" :rules="[{ required: true, message: '姓名不能为空' }]">
          <a-input v-model:value="editedItem.name" placeholder="请输入学生姓名" />
        </a-form-item>
        <a-form-item label="学号" :rules="[{ required: true, message: '学号不能为空' }]">
          <a-input v-model:value="editedItem.studentId" placeholder="请输入学号" />
        </a-form-item>
        <a-form-item label="班级" :rules="[{ required: true, message: '请选择班级' }]">
          <a-select
            v-model:value="editedItem.classId"
            placeholder="请选择班级"
            :options="classOptions"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteDialog"
      title="确认删除"
      @ok="deleteStudent"
      @cancel="deleteDialog = false"
      :confirm-loading="deleting"
    >
      <p>确定要删除学生 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。</p>
    </a-modal>

    <!-- 导入学生对话框 -->
    <a-modal
      v-model:open="importDialog"
      title="导入学生 (CSV 格式文本)"
      @ok="uploadCsv"
      @cancel="handleImportCancel"
      :confirm-loading="importing"
      :width="600"
    >
      <a-alert message="请粘贴格式为 “姓名,学号,班级名称” 的文本，每行一条记录。" type="info" show-icon class="mb-4" />
      <a-textarea
        v-model:value="csvText"
        placeholder="请粘贴学生列表 (CSV 格式)，每行格式：姓名,学号,班级名称"
        :rows="10"
      />
    </a-modal>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// 从 apiService 导入 Student 类型
import { getStudents, getClasses, createStudent, updateStudent, deleteStudent as apiDeleteStudent, type Student } from '@/services/apiService';

// Ant Design 组件
import { SearchOutlined, ReloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';

interface Class {
  id: string;
  name: string;
}

// 定义表单数据的类型，基于导入的 Student 类型
interface EditedStudent {
  id: string;
  name: string;
  studentId: string;
  classId: string | null;
  className?: string;
}

// 表格列定义
const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '') },
  { title: '学号', dataIndex: 'studentId', key: 'studentId' , sorter: (a: any, b: any) => (a.studentId || '').localeCompare(b.studentId || '') },
  { title: '班级', dataIndex: 'className', key: 'className' ,sorter: (a: any, b: any) => (a.className || '').localeCompare(b.className || '') },
  { title: '操作', key: 'actions', }
];

// 数据和状态
const students = ref<(Student & { className?: string })[]>([])
const classes = ref<Class[]>([])
const loading = ref(false)
const dialog = ref(false) // 添加/编辑对话框
const deleteDialog = ref(false)
const saving = ref(false) // 保存 (添加/编辑) 状态
const deleting = ref(false)
const isEditing = ref(false)
const formRef = ref<any>(null)

// 导入相关的新状态
const importDialog = ref(false);
const csvText = ref<string>(''); // 使用 string 存储粘贴的文本
const importing = ref(false); // 导入加载状态

// 筛选条件
const filters = ref({
  classId: null as string | null,
  searchTerm: '',
});

// 当前编辑的项目
const editedItem = ref<EditedStudent>({
  id: '',
  name: '',
  studentId: '',
  classId: null,
});

// 要删除的项目
const itemToDelete = ref<Student | null>(null)

// 获取所有学生
async function fetchStudents() {
  loading.value = true
  try {
    // 构建筛选对象，排除 null 值
    const effectiveFilters: { classId?: string; searchTerm?: string } = {};
    if (filters.value.classId !== null && filters.value.classId !== undefined) {
      effectiveFilters.classId = filters.value.classId;
    }
    if (filters.value.searchTerm) {
      effectiveFilters.searchTerm = filters.value.searchTerm;
    }

    const data = await getStudents(effectiveFilters);
    // Map the data to add className derived from the nested class object
    students.value = data.map(item => ({
      ...item,
      // Derive className from item.class.name if item.class exists
      className: item.class?.name || '无班级' // Provide a default if class is null/undefined
    })) || [];
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 重置编辑项
function resetEditedItem() {
  editedItem.value = {
    id: '',
    name: '',
    studentId: '',
    classId: null,
  };
}

// 编辑学生
function editStudent(item: Student) {
  isEditing.value = true;
  editedItem.value = {
    ...item,
    classId: item.classId || null, // Use classId for editing
  };
  dialog.value = true;
}

// 确认删除学生
function confirmDelete(item: Student) {
  itemToDelete.value = item;
  deleteDialog.value = true;
}

// 保存学生 (新建或编辑)
async function saveStudent() {
  // 前端验证
  if (!editedItem.value.name) {
    console.error('姓名不能为空');
    return;
  }
  if (!editedItem.value.studentId) {
    console.error('学号不能为空');
    return;
  }
  if (!editedItem.value.classId) {
    console.error('请选择班级');
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      // Ensure id is passed for update
      if (!editedItem.value.id) {
         console.error("更新学生时缺少 ID。");
         return; // 或者适当处理此错误
      }
      // Prepare data for update, excluding id and className, and handling null classId
      const dataToUpdate: { name: string; studentId: string; classId?: string } = {
        name: editedItem.value.name,
        studentId: editedItem.value.studentId,
      };
      // Only include classId if it's not null, as the API expects string | undefined, not null
      if (editedItem.value.classId !== null) {
        dataToUpdate.classId = editedItem.value.classId;
      }

      await updateStudent(editedItem.value.id, dataToUpdate);
    } else {
      // Prepare data for create, excluding id and className
      // The form validation ensures classId is not null here for creation
      const dataToCreate: { name: string; studentId: string; classId: string } = { // classId is required for creation
        name: editedItem.value.name,
        studentId: editedItem.value.studentId,
        classId: editedItem.value.classId!, // Assert non-null because form validation requires it
      };
      await createStudent(dataToCreate);
    }
    dialog.value = false;
    resetEditedItem();
    fetchStudents(); // Refresh list
  } catch (error) {
    console.error('保存学生失败:', error);
    // Optionally show a user-friendly error message
  } finally {
    saving.value = false;
  }
}

// 删除学生
async function deleteStudent() {
  if (!itemToDelete.value) return;

  deleting.value = true;
  try {
    await apiDeleteStudent(itemToDelete.value.id);
    deleteDialog.value = false;
    itemToDelete.value = null;
    fetchStudents(); // Refresh list
  } catch (error) {
    console.error('删除学生失败:', error);
    // Optionally show a user-friendly error message
  } finally {
    deleting.value = false;
  }
}

// 初始化数据
onMounted(() => {
  fetchClasses();
  fetchStudents();
});

// 获取所有班级
async function fetchClasses() {
  try {
    const data = await getClasses();
    classes.value = data || [];
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// --- CSV 导入的新方法 ---
async function uploadCsv() {
  // 检查是否有文本内容
  if (!csvText.value) {
    console.error("未粘贴文本内容。");
    return;
  }

  importing.value = true;
  const text = csvText.value;

  // 获取班级列表并创建名称到ID的映射
  let classNameToIdMap = new Map<string, string>();
  try {
    const classList = await getClasses();
    classList.forEach(cls => {
      classNameToIdMap.set(cls.name.trim(), cls.id);
    });
  } catch (error) {
    console.error('获取班级列表失败，无法进行导入:', error);
    importing.value = false;
    // 可选：显示用户友好的错误消息
    return;
  }

  const lines = text.split('\n').filter(line => line.trim() !== ''); // 按行分割，移除空行
  // 存储准备导入的学生数据 (包含查找到的 classId)
  const studentsToImport: { name: string; studentId: string; classId: string }[] = [];
  let hasError = false;
  let failedImports = 0; // Track failures during parsing/lookup

  for (const line of lines) {
    const parts = line.split(',');
    // 期望格式: 姓名,学号,班级名称
    if (parts.length === 3) {
      const [name, studentId, className] = parts.map(p => p.trim());
      // 检查字段是否为空
      if (name && studentId && className) {
         // 根据班级名称查找班级ID
         const classId = classNameToIdMap.get(className);
         if (classId) {
            studentsToImport.push({ name, studentId, classId });
         } else {
            console.warn(`跳过学生 "${name}" (${studentId})：未找到班级名称 "${className}" 对应的班级ID。`);
            failedImports++; // Increment failed count for lookup failures
            hasError = true;
         }
      } else {
         console.warn(`跳过无效行（字段为空）：${line}`);
         failedImports++; // Increment failed count for parsing failures
         hasError = true;
      }
    } else {
      console.warn(`跳过无效行（字段数量错误）：${line}`);
      failedImports++; // Increment failed count for parsing failures
      hasError = true;
    }
  }

  if (studentsToImport.length === 0) {
      console.warn("粘贴的文本中未找到有效的学生数据或所有班级名称均无效。");
      importing.value = false;
      // 可选：显示用户友好的消息，说明有多少行被跳过
      if (failedImports > 0) {
          console.warn(`共跳过 ${failedImports} 行无效或班级名称未找到的记录。`);
      }
      return;
  }

  let successfulImports = 0;

  // 现在 studentsToImport 包含 name, studentId, 和查找到的 classId
  for (const studentData of studentsToImport) {
    try {
      // 使用现有的 createStudent API 调用，studentData 包含 name, studentId, classId
      await createStudent(studentData);
      successfulImports++;
    } catch (error) {
      console.error(`导入学生失败 ${studentData.name} (${studentData.studentId}):`, error);
      failedImports++; // Increment failed count for API call failures
      hasError = true; // 标记处理过程中存在错误
    }
  }

  importing.value = false;
  importDialog.value = false;
  // 清空文本区域
  csvText.value = ''; // 清空粘贴的文本

  // 可选：显示摘要消息
  if (hasError || failedImports > 0) {
      console.warn(`CSV 文本导入完成，存在问题。成功：${successfulImports}，失败：${failedImports}。请检查控制台获取详情。`);
      // 您可能希望在此处显示一个 snackbar 或 alert
  } else {
      console.log(`CSV 文本导入成功。总共导入学生：${successfulImports}。`);
      // 您可能希望在此处显示一个成功 snackbar
  }

  fetchStudents(); // 导入后刷新学生列表
}

// 添加计算属性用于过滤学生
const filteredStudents = computed(() => {
  let result = students.value;
  if (filters.value.classId) {
    result = result.filter(student => student.classId === filters.value.classId);
  }
  if (filters.value.searchTerm) {
    const searchTerm = filters.value.searchTerm.toLowerCase().trim();
    result = result.filter(student => 
      student.name.toLowerCase().includes(searchTerm)
    );
  }
  return result;
});

// 本地搜索处理
function handleSearch() {
  // 无需额外操作，computed属性会自动处理过滤
}

// 取消导入处理
function handleImportCancel() {
  importDialog.value = false;
  csvText.value = '';
}

// 计算班级选项，用于选择器
const classOptions = computed(() => {
  return classes.value.map(cls => ({
    label: cls.name,
    value: cls.id
  }));
});
</script>

<style scoped>
.students-container {
  padding: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.mr-4 {
  margin-right: 16px;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

/* 表格主题修复 */
:deep(.ant-table) {
  background: var(--ant-color-bg-container);
}

:deep(.ant-table-thead > tr > th) {
  background: var(--ant-color-bg-layout);
  color: var(--ant-color-text-heading);
  border-bottom: 1px solid var(--ant-color-border);
}

:deep(.ant-table-tbody > tr > td) {
  background: var(--ant-color-bg-container);
  color: var(--ant-color-text);
  border-bottom: 1px solid var(--ant-color-border);
}

:deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: var(--ant-color-fill-secondary);
}

:deep(.ant-table-tbody > tr.ant-table-row-selected td) {
  background: var(--ant-color-primary-bg);
}

:deep(.ant-pagination) {
  background: var(--ant-color-bg-container);
  padding-top: 8px;
}

:deep(.ant-pagination-options) {
  color: var(--ant-color-text);
}

:deep(.ant-pagination-item) {
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border);
  color: var(--ant-color-text);
}

:deep(.ant-pagination-item-active) {
  background: var(--ant-color-primary);
  border-color: var(--ant-color-primary);
  color: var(--ant-color-white);
}
</style>

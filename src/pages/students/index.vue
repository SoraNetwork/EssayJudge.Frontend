<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">学生管理</h1>
      <div>
        <v-btn color="secondary" prepend-icon="mdi-upload" @click="importDialog = true" class="mr-2">导入学生</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">添加学生</v-btn>
      </div>
    </div>

    <!-- 筛选条件 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.classId"
              label="班级"
              :items="classes"
              item-title="name"
              item-value="id"
              clearable
              @update:model-value="fetchStudents"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.searchTerm"
              label="按姓名搜索学生"
              prepend-icon="mdi-magnify"
              clearable
              @input="handleLocalSearch"
              placeholder="输入学生姓名搜索"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" @click="fetchStudents" prepend-icon="mdi-refresh">
              刷新
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 学生列表 -->
    <v-card>
      <v-card-text class="responsive-table-container">
        <!-- 桌面端表格 -->
        <v-data-table
          v-if="display.mdAndUp.value"
          :headers="headers"
          :items="filteredStudents"
          :loading="loading"
          loading-text="加载中..."
          no-data-text="暂无数据"
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
            </v-btn>
          </template>
        </v-data-table>

        <!-- 移动端列表 -->
        <v-list v-else>
          <v-list-item
            v-for="item in filteredStudents"
            :key="item.id"
            class="mb-2"
          >
            <v-list-item-content>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ item.studentId }} - {{ item.className }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <template v-slot:append>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- 新建/编辑学生对话框 -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑学生' : '添加学生' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveStudent">
            <v-text-field
              v-model="editedItem.name"
              label="姓名"
              :rules="[v => !!v || '姓名不能为空']"
              required
            ></v-text-field>
            <v-text-field
              v-model="editedItem.studentId"
              label="学号"
              :rules="[v => !!v || '学号不能为空']"
              required
            ></v-text-field>
            <v-select
              v-model="editedItem.classId"
              label="班级"
              :items="classes"
              item-title="name"
              item-value="id"
              :rules="[v => !!v || '请选择班级']"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveStudent" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>确定要删除学生 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteStudent" :loading="deleting">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 导入学生对话框 -->
    <v-dialog v-model="importDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">导入学生 (CSV 格式文本)</span>
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            请粘贴格式为 "姓名,学号,班级名称" 的文本，每行一条记录。
          </v-alert>
          <v-textarea
            v-model="csvText"
            label="粘贴学生列表 (CSV 格式)"
            prepend-icon="mdi-clipboard-text"
            :rules="[v => !!v || '请粘贴文本']"
            rows="10"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="importDialog = false; csvText = ''">取消</v-btn>
          <v-btn color="primary" @click="uploadCsv" :loading="importing" :disabled="!csvText">上传并导入</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <BackToTop />
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
// 从 apiService 导入 Student 类型
import { getStudents, getClasses, createStudent, updateStudent, deleteStudent as apiDeleteStudent, type Student } from '@/services/apiService';

const display = useDisplay()

interface Class {
  id: string;
  name: string;
}

// 定义表单数据的类型，基于导入的 Student 类型
// 允许 classId 为 null 以适应 select 组件
// 显式定义表单所需的属性
interface EditedStudent {
  id: string;
  name: string;
  studentId: string;
  classId: string | null;
  // 如果表单中需要 Student 的其他属性，例如 className，请在此添加
  className?: string; // Keep className here as it's used in the form/table
}

// 表格列定义
const headers = [
  { title: '姓名', key: 'name' },
  { title: '学号', key: 'studentId' },
  { title: '班级', key: 'className' },
  { title: '操作', key: 'actions', sortable: false }
]

// 数据和状态
// Update students ref type to include className for table display
const students = ref<(Student & { className?: string })[]>([])
const classes = ref<Class[]>([])
const loading = ref(false)
const dialog = ref(false) // 添加/编辑对话框
const deleteDialog = ref(false)
const saving = ref(false) // 保存 (添加/编辑) 状态
const deleting = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

// 导入相关的新状态
const importDialog = ref(false);
// 将 csvFile 改为 csvText，类型改为 string
const csvText = ref<string>(''); // 使用 string 存储粘贴的文本
const importing = ref(false); // 导入加载状态

// 添加新的状态
// const searchResults = ref<(Student & { className?: string })[]>([]);
// const searchLoading = ref(false);

// 筛选条件
const filters = ref({
  classId: null as string | null,
  searchTerm: '',
});

// 当前编辑的项目
const editedItem = ref<EditedStudent>({ // 使用 EditedStudent 类型
  id: '',
  name: '',
  studentId: '',
  classId: null, // 允许 null 作为初始状态和未选择状态
})
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
  // Ensure all properties are copied, including id
  // When editing, we need the classId for the select dropdown
  editedItem.value = {
    ...item,
    classId: item.classId || null, // Use classId for editing
    // className is not needed for the form, but keep it if EditedStudent requires it
    // className: item.class?.name || '无班级' // This is derived, not needed for editing data
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
  if (!form.value) return;
  const { valid } = await form.value.validate();

  if (!valid) {
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
      } else {
        // If classId is explicitly set to null in the form, send undefined or null depending on API
        // Assuming API expects undefined to mean "no change" and null to mean "remove class"
        // Let's send undefined if null is selected in the form, meaning no class change
        // If you need to explicitly remove a student from a class, the API needs to support sending null/empty classId
        // For now, if null is selected, we just don't include classId in the update payload.
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
  if (!filters.value.searchTerm) {
    return students.value;
  }
  const searchTerm = filters.value.searchTerm.toLowerCase().trim();
  return students.value.filter(student => 
    student.name.toLowerCase().includes(searchTerm)
  );
});

// 本地搜索处理
function handleLocalSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  filters.value.searchTerm = value;
  // 不需要调用后端API，computed属性会自动处理过滤
}

// 移除原有的handleSearch函数
</script>
}


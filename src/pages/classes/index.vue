<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold">班级管理</h1>
      <a-button type="primary" @click="dialog = true" style="margin-bottom: 8px;">
        <template #icon><PlusOutlined /></template>
        添加班级
      </a-button>
    </div>

    <!-- 班级列表 -->
    <a-card>
      <div class="responsive-table-container">
        <!-- 桌面端表格 -->
        <a-table
          v-if="display.mdAndUp.value"
          :columns="columns"
          :data-source="classes"
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-button type="link" :href="`/classes/${record.id}`">{{ record.name }}</a-button>
            </template>
            <template v-if="column.key === 'studentCount'">
              <a-tag>{{ record.studentCount || 0 }}</a-tag>
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="text" size="small" danger @click="confirmDelete(record)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </template>
          </template>
        </a-table>

        <!-- 移动端列表 -->
        <a-list v-else :data-source="classes" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item class="mb-2" :href="`/classes/${item.id}`">
              <a-list-item-meta>
                <template #title>{{ item.name }}</template>
                <template #description>学生数量: {{ item.studentCount || 0 }}</template>
              </a-list-item-meta>
              <template #actions>
                <a-button type="text" size="small" danger @click.prevent="confirmDelete(item)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-card>

    <!-- 新建班级对话框 -->
    <a-modal
      v-model:open="dialog"
      title="添加班级"
      :confirm-loading="saving"
      @ok="saveClass"
      @cancel="dialog = false"
      width="600px"
    >
      <a-form ref="form" :model="editedItem" layout="vertical">
        <a-form-item
          label="班级名称"
          name="name"
          :rules="[{ required: true, message: '班级名称不能为空' }]"
        >
          <a-input
            v-model:value="editedItem.name"
            @keyup.enter="saveClass"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteDialog"
      title="确认删除"
      :confirm-loading="deleting"
      @ok="deleteClass"
      @cancel="deleteDialog = false"
    >
      <p>
        确定要删除班级 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。
      </p>
      <div class="mt-2" v-if="itemToDelete && itemToDelete.studentCount > 0">
        <a-alert
          message="注意"
          :description="`该班级下有 ${itemToDelete.studentCount} 名学生，删除班级将导致这些学生失去班级关联。`"
          type="warning"
          show-icon
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { getClasses, createClass, deleteClass as apiDeleteClass, getStudents } from '@/services/apiService';

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

// 定义班级项的类型
interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
}

// 表格列定义
const columns = [
  { title: '班级名称', dataIndex: 'name', key: 'name' },
  { title: '学生数量', dataIndex: 'studentCount', key: 'studentCount' },
  { title: '操作', key: 'actions' }
]

// 数据和状态
const classes = ref<ClassItem[]>([]) // 班级列表的ref
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const form = ref<any>(null)

// 当前编辑的项目 (只用于新建)
const editedItem = ref<{ name: string }>({
  name: '',
})

// 要删除的项目
const itemToDelete = ref<ClassItem | null>(null) // 待删除项的ref

// 获取所有班级
async function fetchClasses() {
  loading.value = true
  try {
    const data = await getClasses(); // 假设 getClasses 返回一个包含 id 和 name 属性的对象数组
    const classesWithCount: ClassItem[] = []; // 用于存放带学生数量的班级项的数组

    for (const classItem of data || []) {
      try {
        const studentsResponse = await getStudents({ classId: classItem.id });
        classesWithCount.push({
          id: classItem.id, // 假设 id 存在
          name: classItem.name, // 假设 name 存在
          studentCount: studentsResponse.length || 0
        });
      } catch (error) {
        console.error(`获取班级 ${classItem.name} 的学生数量失败:`, error)
        classesWithCount.push({
          id: classItem.id,
          name: classItem.name,
          studentCount: 0 // 错误时默认为 0
        });
      }
    }
    classes.value = classesWithCount; // 赋值类型化的数组
  } catch (error) {
    console.error('获取班级列表失败:', error)
    classes.value = []; // 错误时赋值空数组
  } finally {
    loading.value = false
  }
}

// 保存班级 (只处理新建)
async function saveClass() {
  try {
    await form.value.validate();
  } catch (error) {
    return;
  }

  saving.value = true
  try {
    const dataToSave = { name: editedItem.value.name! }; // 总是只发送 name

    await createClass(dataToSave);

    // 关闭对话框并刷新列表
    dialog.value = false
    await fetchClasses()

    // 重置表单
    resetForm()
  } catch (error) {
    console.error('保存班级失败:', error)
  } finally {
    saving.value = false
  }
}

// 确认删除
function confirmDelete(item: ClassItem) { // Type the item parameter
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除班级
async function deleteClass() {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    await apiDeleteClass(itemToDelete.value.id);
    deleteDialog.value = false
    await fetchClasses()
  } catch (error) {
    console.error('删除班级失败:', error)
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

// 重置表单
function resetForm() {
  editedItem.value = {
    name: '',
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchClasses()
})
</script>
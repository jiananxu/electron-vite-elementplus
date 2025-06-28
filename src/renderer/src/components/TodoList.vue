<template>
  <div class="todo-list-container">
    <div class="todo-header">
      <h2>待办事项</h2>
      <p class="description">管理你的日常任务和待办事项</p>

      <!-- 添加新任务 -->
      <div class="add-task-section">
        <el-input
          v-model="newTask"
          placeholder="添加新任务..."
          class="input-with-button"
          @keyup.enter="addTask"
        >
          <template #append>
            <el-button @click="addTask" :disabled="!newTask.trim()">
              <el-icon><Plus /></el-icon>添加
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 任务过滤 -->
      <div class="filter-section">
        <el-radio-group v-model="filter" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="active">进行中</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
        </el-radio-group>

        <div class="task-stats">
          {{ activeTasksCount }} 个待完成, {{ completedTasksCount }} 个已完成
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-scrollable-container">
      <el-empty v-if="filteredTasks.length === 0" description="暂无任务"></el-empty>

      <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="task in filteredTasks" :key="task.id">
        <el-card class="task-card" :class="{ 'completed': task.completed }">
          <div class="task-header">
            <el-checkbox v-model="task.completed" @change="saveToLocalStorage"></el-checkbox>
            <div class="task-actions">
              <el-tooltip content="设置截止日期" placement="top" v-if="editingTaskId !== task.id">
                <el-button type="info" size="small" circle @click="openDatePicker(task)">
                  <el-icon><Calendar /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="编辑" placement="top" v-if="editingTaskId !== task.id">
                <el-button type="primary" size="small" circle @click="editTask(task)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="保存" placement="top" v-else>
                <el-button type="success" size="small" circle @click="saveTask(task)">
                  <el-icon><Check /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="删除" placement="top">
                <el-button type="danger" size="small" circle @click="deleteTask(task)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <div class="task-content">
            <div v-if="editingTaskId !== task.id" class="task-text" :class="{ 'completed-text': task.completed }">
              <div class="task-title">{{ task.title }}</div>
              <div v-if="task.dueDate" class="task-due-date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(task.dueDate) }}
              </div>
            </div>

            <div v-else class="task-edit">
              <el-input v-model="editingTaskText" @keyup.enter="saveTask(task)" ref="editInput"></el-input>
            </div>
          </div>
        </el-card>
      </el-col>
      </el-row>
    </div>

    <!-- 日期选择器对话框 -->
    <el-dialog v-model="datePickerVisible" title="设置截止日期" width="300px" append-to-body>
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        style="width: 100%"
      ></el-date-picker>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="datePickerVisible = false">取消</el-button>
          <el-button type="primary" @click="setDueDate">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  Check,
  Calendar
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Task {
  id: number
  title: string
  completed: boolean
  dueDate: string | null
}

// 任务列表
const tasks = ref<Task[]>([])
const newTask = ref('')
const filter = ref('all')
const editingTaskId = ref<number | null>(null)
const editingTaskText = ref('')
const datePickerVisible = ref(false)
const selectedDate = ref<Date | null>(null)
const currentTaskForDate = ref<Task | null>(null)
const editInput = ref<HTMLInputElement | null>(null)

// 从本地存储加载任务
onMounted(() => {
  const savedTasks = localStorage.getItem('todo-tasks')
  if (savedTasks) {
    tasks.value = JSON.parse(savedTasks)
  }
})

// 保存到本地存储
const saveToLocalStorage = () => {
  localStorage.setItem('todo-tasks', JSON.stringify(tasks.value))
}

// 添加新任务
const addTask = () => {
  if (newTask.value.trim()) {
    const task: Task = {
      id: Date.now(),
      title: newTask.value.trim(),
      completed: false,
      dueDate: null
    }
    tasks.value.unshift(task)
    newTask.value = ''
    saveToLocalStorage()
    ElMessage({
      message: '任务已添加',
      type: 'success'
    })
  }
}

// 删除任务
const deleteTask = (task: Task) => {
  const index = tasks.value.findIndex(t => t.id === task.id)
  if (index !== -1) {
    tasks.value.splice(index, 1)
    saveToLocalStorage()
    ElMessage({
      message: '任务已删除',
      type: 'success'
    })
  }
}

// 编辑任务
const editTask = (task: Task) => {
  editingTaskId.value = task.id
  editingTaskText.value = task.title
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
    }
  })
}

// 保存编辑后的任务
const saveTask = (task: Task) => {
  if (editingTaskText.value.trim()) {
    task.title = editingTaskText.value.trim()
    editingTaskId.value = null
    saveToLocalStorage()
    ElMessage({
      message: '任务已更新',
      type: 'success'
    })
  }
}

// 打开日期选择器
const openDatePicker = (task: Task) => {
  currentTaskForDate.value = task
  selectedDate.value = task.dueDate ? new Date(task.dueDate) : null
  datePickerVisible.value = true
}

// 设置截止日期
const setDueDate = () => {
  if (currentTaskForDate.value) {
    currentTaskForDate.value.dueDate = selectedDate.value ? selectedDate.value.toISOString() : null
    saveToLocalStorage()
    datePickerVisible.value = false
    ElMessage({
      message: '截止日期已设置',
      type: 'success'
    })
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// 过滤任务
const filteredTasks = computed(() => {
  switch (filter.value) {
    case 'active':
      return tasks.value.filter(task => !task.completed)
    case 'completed':
      return tasks.value.filter(task => task.completed)
    default:
      return tasks.value
  }
})

// 统计信息
const activeTasksCount = computed(() => {
  return tasks.value.filter(task => !task.completed).length
})

const completedTasksCount = computed(() => {
  return tasks.value.filter(task => task.completed).length
})
</script>

<style scoped>
.todo-list-container {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.todo-header {
  padding: 20px 20px 0;
  background-color: #fff;
  z-index: 1;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.add-task-section {
  margin-bottom: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.input-with-button {
  width: 100%;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.tasks-scrollable-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  margin-top: 20px;
}

.task-stats {
  font-size: 14px;
  color: #666;
}

.task-card {
  height: 150px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
}

.task-card:hover {
  transform: translateY(-5px);
}

.task-card.completed {
  opacity: 0.7;
  background-color: #f9f9f9;
}

.task-card.completed .task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-text {
  flex: 1;
}

.task-title {
  font-size: 16px;
  margin-bottom: 8px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-due-date {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
}

.task-due-date .el-icon {
  margin-right: 5px;
}

.completed-text {
  text-decoration: line-through;
  color: #999;
}

.task-edit {
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .todo-list-container {
    padding: 10px;
  }

  .task-card {
    height: auto;
    min-height: 120px;
  }
}
</style>

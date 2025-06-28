<script setup lang="ts">
import { ref } from 'vue'
import { Operation, Calendar, Link, InfoFilled } from '@element-plus/icons-vue'
import HashCalculator from './components/HashCalculator.vue'
import Version from './components/Versions.vue'
import TodoList from './components/TodoList.vue'
import CommonWebsites from './components/CommonWebsites.vue'

const activeMenu = ref('hash-calculator')
const handleSelect = (key: string) => {
  activeMenu.value = key
}
</script>

<template>
  <div class="app-container">
    <!-- 菜单栏 - Element Plus 风格 -->
    <el-menu
      :default-active="activeMenu"
      class="el-menu-demo"
      mode="horizontal"
      :ellipsis="false"
      @select="handleSelect"
    >
      <el-menu-item index="hash-calculator">
        <el-icon><Operation /></el-icon>
        <span>哈希计算</span>
      </el-menu-item>
      <el-menu-item index="todo-list">
        <el-icon><Calendar /></el-icon>
        <span>待办列表</span>
      </el-menu-item>
      <el-menu-item index="common-websites">
        <el-icon><Link /></el-icon>
        <span>常用网站</span>
      </el-menu-item>
      <el-menu-item index="about">
        <el-icon><InfoFilled /></el-icon>
        <span>关于</span>
      </el-menu-item>
    </el-menu>

    <!-- 内容区域 -->
    <div class="content-area">
      <HashCalculator v-if="activeMenu === 'hash-calculator'" />
      <TodoList v-else-if="activeMenu === 'todo-list'" />
      <CommonWebsites v-else-if="activeMenu === 'common-websites'" />
      <Version v-else-if="activeMenu === 'about'" />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f1f2f6;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-header {
  background-color: #1a1b1f;
  color: #ffffff;
  padding: 12px 24px;
  text-align: left;
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.el-menu-demo {
  --el-menu-hover-bg-color: var(--el-color-primary-light-9);
  --el-menu-active-color: var(--el-color-primary);
  border-bottom: solid 1px var(--el-border-color-light) !important;
  padding: 0 20px;
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  margin: 0;
  background-color: #ffffff;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.hash-calculator) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

:deep(.el-menu-item) {
  font-size: 14px;
  height: 56px;
  line-height: 56px;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 4px;
  font-size: 18px;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom: 2px solid var(--el-color-primary);
  font-weight: 500;
}
</style>

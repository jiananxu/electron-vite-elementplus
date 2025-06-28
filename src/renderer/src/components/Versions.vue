<template>
  <div class="version-info">
    <h2>版本信息</h2>
    <p><strong>Electron:</strong> v{{ versions.electron }}</p>
    <p><strong>Chromium:</strong> v{{ versions.chrome }}</p>
    <p><strong>Node:</strong> v{{ versions.node }}</p>

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

// 默认版本信息
const defaultVersions = {
  electron: '未知',
  chrome: '未知',
  node: '未知'
}

// 检查 window.electron 是否可用
const versions = reactive(
  window.electron && window.electron.process && window.electron.process.versions
    ? { ...window.electron.process.versions }
    : { ...defaultVersions }
)
</script>

<style scoped>
.version-info {
  padding: 20px;
}

.version-info h2 {
  margin-bottom: 10px;
}

.version-info p {
  margin: 5px 0;
}
</style>

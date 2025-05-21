<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Upload } from '@element-plus/icons-vue'

interface HashResult {
  filename: string
  path: string
  hash: {
    [key: string]: string
  }
}

const hashTypes = reactive({
  MD5: false,
  SHA1: false,
  SHA256: true,
  SHA512: false
})

// 不再需要文件扩展名过滤
const results = ref<HashResult[]>([])
const directoryPath = ref('')
// 为每个按钮创建独立的 loading 状态
const isFileProcessing = ref(false)
const isDirectoryProcessing = ref(false)

// 创建选中类型的数组，用于 checkbox-group
const selectedTypes = ref<string[]>(['SHA256']) // 默认选中 SHA256

// 监听 selectedTypes 变化，更新 hashTypes
watch(selectedTypes, (newTypes) => {
  // 先将所有算法设为 false
  Object.keys(hashTypes).forEach((key) => {
    hashTypes[key] = false
  })

  // 再将选中的设为 true
  newTypes.forEach((type) => {
    if (type in hashTypes) {
      hashTypes[type] = true
    }
  })
})

// 初始化 selectedTypes 数组
onMounted(() => {
  selectedTypes.value = Object.entries(hashTypes)
    .filter(([_, selected]) => selected)
    .map(([type]) => type)
})

// 计算选中的哈希算法
const selectedAlgorithms = computed(() => {
  return Object.entries(hashTypes)
    .filter(([_, selected]) => selected)
    .map(([type]) => type)
})

// 处理文件上传 - 使用原生文件选择对话框
const handleFileChange = async () => {
  // 检查是否选择了至少一种哈希算法
  if (selectedAlgorithms.value.length === 0) {
    ElMessage.warning('请至少选择一种哈希算法')
    return
  }

  isFileProcessing.value = true
  results.value = [] // 清除之前的结果

  try {
    const hashResult = await window.api.uploadAndCalculateHash(selectedAlgorithms.value)

    if (hashResult.success) {
      const result: HashResult = {
        filename: hashResult.fileName!,
        path: hashResult.filePath!,
        hash: hashResult.results!
      }
      results.value = [result] // 只保留最新的结果
    } else {
      if (hashResult.error !== 'File selection canceled') {
        ElMessage.error(`计算哈希失败: ${hashResult.error}`)
      }
    }
  } catch (error: any) {
    ElMessage.error(`发生错误: ${error.message}`)
  } finally {
    isFileProcessing.value = false
  }
}

// 处理文件拖拽
const handleDrop = async (e: DragEvent) => {
  e.preventDefault()

  // 获取拖拽的文件列表
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length === 0) return

  // 检查是否选择了至少一种哈希算法
  if (selectedAlgorithms.value.length === 0) {
    ElMessage.warning('请至少选择一种哈希算法')
    return
  }

  isFileProcessing.value = true

  try {
    // 由于 Electron 的安全限制，我们使用 uploadAndCalculateHash API
    // 这将打开一个文件选择对话框，但用户可以直接选择刚才拖拽的文件
    const hashResult = await window.api.uploadAndCalculateHash(selectedAlgorithms.value)

    if (hashResult.success) {
      const result: HashResult = {
        filename: hashResult.fileName!,
        path: hashResult.filePath!,
        hash: hashResult.results!
      }
      results.value = [result] // 保存结果
      ElMessage.success(`成功计算 ${result.filename} 的哈希值`)
    } else {
      if (hashResult.error !== 'File selection canceled') {
        ElMessage.error(`计算哈希失败: ${hashResult.error}`)
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ElMessage.error(`处理文件时发生错误: ${errorMessage}`)
  } finally {
    isFileProcessing.value = false
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
}

// 处理目录选择
const handleDirectorySelect = async () => {
  isDirectoryProcessing.value = true

  try {
    // 检查是否选择了至少一种哈希算法
    if (selectedAlgorithms.value.length === 0) {
      ElMessage.warning('请至少选择一种哈希算法')
      return
    }

    // 选择目录
    const dirPath = await window.api.selectDirectory()

    // 如果用户取消了选择，则直接返回
    if (!dirPath) {
      return
    }

    directoryPath.value = dirPath

    // 扫描目录
    const scanResult = await window.api.scanDirectory(dirPath)

    if (scanResult.success && scanResult.files && scanResult.files.length > 0) {
      results.value = [] // 清除之前的结果

      // 处理每个文件
      for (const filePath of scanResult.files) {
        try {
          const pathParts = filePath.split(/[/\\]/)
          const filename = pathParts[pathParts.length - 1]

          // 计算哈希
          const hashResult = await window.api.calculateHash(filePath, selectedAlgorithms.value)

          if (hashResult.success && hashResult.results) {
            // 创建结果对象并添加到列表
            const result: HashResult = {
              filename,
              path: filePath,
              hash: hashResult.results
            }
            results.value.push(result)
          } else {
            ElMessage.error(`计算文件 ${filename} 哈希失败: ${hashResult.error || '未知错误'}`)
          }
        } catch (fileError: unknown) {
          console.error('处理文件时出错:', fileError)
          const errorMessage = fileError instanceof Error ? fileError.message : String(fileError)
          ElMessage.error(`处理文件时出错: ${errorMessage || '未知错误'}`)
        }
      }
    } else if (scanResult.success && (!scanResult.files || scanResult.files.length === 0)) {
      ElMessage.info(`在目录 ${dirPath} 中没有找到任何文件`)
    } else {
      ElMessage.error(`扫描目录失败: ${scanResult.error || '未知错误'}`)
    }
  } catch (error: unknown) {
    console.error('选择目录时发生错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    ElMessage.error(`选择目录时发生错误: ${errorMessage || '未知错误'}`)
  } finally {
    isDirectoryProcessing.value = false
  }
}

// 复制哈希值到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (err: unknown) {
    ElMessage.error('复制失败')
    console.error('复制失败:', err)
  }
}
</script>

<template>
  <div class="hash-calculator">
    <el-card class="config-section" shadow="never">
      <template #header>
        <div class="card-header">
          <span>哈希算法选择</span>
        </div>
      </template>
      <div class="hash-types">
        <el-space wrap>
          <el-checkbox-group v-model="selectedTypes">
            <el-checkbox-button v-for="(_, type) in hashTypes" :key="type" :label="type">
              {{ type }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-space>
      </div>
    </el-card>

    <div class="operation-section">
      <div class="upload-section" @drop="handleDrop" @dragover="handleDragOver">
        <div class="buttons-row">
          <div class="button-container">
            <el-button
              type="primary"
              :loading="isFileProcessing"
              :icon="Upload"
              @click="handleFileChange"
            >
              选择文件计算哈希值
            </el-button>
          </div>

          <div class="button-container">
            <el-button
              type="primary"
              @click="handleDirectorySelect"
              :loading="isDirectoryProcessing"
              >选择目录计算哈希值
            </el-button>
          </div>
        </div>

        <div v-if="directoryPath" class="directory-path-container">
          <span class="directory-path">{{ directoryPath }}</span>
        </div>
      </div>

      <div class="results-section" v-if="results.length">
        <h3>计算结果</h3>
        <el-table :data="results" style="width: 100%">
          <el-table-column prop="filename" label="文件名" />
          <el-table-column prop="path" label="路径" />
          <el-table-column label="哈希值">
            <template #default="{ row }">
              <div v-for="(value, type) in row.hash" :key="type" class="hash-result">
                <div class="hash-value-container">
                  <strong>{{ type }}:</strong>
                  <span class="hash-value">{{ value }}</span>
                  <el-button
                    v-if="value !== '计算中...' && value !== '计算失败'"
                    type="primary"
                    size="small"
                    :icon="CopyDocument"
                    circle
                    @click="copyToClipboard(value)"
                    class="copy-button"
                  ></el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hash-calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

.config-section {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hash-types {
  display: flex;
  justify-content: center;
}

.file-extensions {
  margin-top: 16px;
}

.extension-input {
  max-width: 400px;
  margin-bottom: 12px;
}

.extension-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.extension-tag {
  margin-right: 8px;
}

.operation-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-bg-color);
}

.upload-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.buttons-row {
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-bottom: 16px;
}

.button-container {
  display: flex;
}

.upload-area.is-processing {
  opacity: 0.7;
  cursor: not-allowed;
}

.file-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.directory-path-container {
  display: flex;
  margin-top: 8px;
}

.directory-path {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results-section h3 {
  flex-shrink: 0;
}

.el-table {
  flex: 1;
  overflow: auto;
}

.hash-result {
  margin-bottom: 8px;
}

.hash-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hash-value {
  font-family: monospace;
  background-color: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
}

.copy-button {
  flex-shrink: 0;
}

h2,
h3 {
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

h2 {
  font-size: 20px;
}

h3 {
  font-size: 16px;
}

:deep(.el-checkbox) {
  margin-right: 16px;
}

@media (max-width: 768px) {
  .buttons-row {
    flex-direction: column;
    gap: 12px;
  }

  .button-container {
    width: 100%;
  }

  .button-container .el-button {
    width: 100%;
  }

  .directory-path-container {
    width: 100%;
  }

  .directory-path {
    max-width: 100%;
  }
}
</style>

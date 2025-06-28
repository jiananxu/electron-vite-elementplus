<template>
  <div class="common-websites-container">
    <div class="websites-header">
      <h2>常用网站</h2>
      <p class="description">快速访问常用网站，点击卡片即可在默认浏览器中打开</p>
    </div>

    <div class="websites-scrollable-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="site in websites" :key="site.name">
          <el-card class="website-card" shadow="hover" @click="visitWebsite(site.url)">
            <div class="website-icon">
              <el-icon :size="24">
                <el-icon-link v-if="site.icon === 'Link'" />
                <el-icon-search v-else-if="site.icon === 'Search'" />
                <el-icon-video-play v-else-if="site.icon === 'VideoPlay'" />
                <el-icon-reading v-else-if="site.icon === 'Reading'" />
                <el-icon-document v-else-if="site.icon === 'Document'" />
                <el-icon-collection v-else-if="site.icon === 'Collection'" />
                <el-icon-promotion v-else-if="site.icon === 'Promotion'" />
                <el-icon-notebook v-else-if="site.icon === 'Notebook'" />
                <el-icon-link v-else />
              </el-icon>
            </div>
            <div class="website-info">
              <h3>{{ site.name }}</h3>
              <p>{{ site.description }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-divider />

      <div class="add-website-section">
        <h3>添加自定义网站</h3>
        <el-form :model="newWebsite" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="newWebsite.name" placeholder="网站名称"></el-input>
          </el-form-item>
          <el-form-item label="URL" prop="url">
            <el-input v-model="newWebsite.url" placeholder="https://example.com"></el-input>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="newWebsite.description" placeholder="网站描述"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addWebsite">添加网站</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import {
  Link as ElIconLink,
  Search as ElIconSearch,
  VideoPlay as ElIconVideoPlay,
  Reading as ElIconReading,
  Document as ElIconDocument,
  Collection as ElIconCollection,
  Promotion as ElIconPromotion,
  Notebook as ElIconNotebook
} from '@element-plus/icons-vue'

// 定义类型
interface Website {
  name: string
  url: string
  description: string
  icon: string
}

// 网站列表
const websites = ref<Website[]>([
  {
    name: '百度',
    url: 'https://www.baidu.com',
    description: '中文搜索引擎',
    icon: 'Search'
  },
  {
    name: 'Google',
    url: 'https://www.google.com',
    description: '全球最大搜索引擎',
    icon: 'Search'
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: '代码托管平台',
    icon: 'Document'
  },
  {
    name: 'Bilibili',
    url: 'https://www.bilibili.com',
    description: '视频分享平台',
    icon: 'VideoPlay'
  },
  {
    name: '知乎',
    url: 'https://www.zhihu.com',
    description: '中文问答社区',
    icon: 'Reading'
  },
  {
    name: '掘金',
    url: 'https://juejin.cn',
    description: '开发者社区',
    icon: 'Notebook'
  }
])

// 新网站表单接口
interface NewWebsiteForm {
  name: string
  url: string
  description: string
  icon: string
}

// 新网站表单
const newWebsite = reactive<NewWebsiteForm>({
  name: '',
  url: '',
  description: '',
  icon: 'Link'
})

// 表单验证规则类型
type FormRules = {
  name: Array<{
    required?: boolean
    message: string
    trigger: 'blur'
    min?: number
    max?: number
  }>
  url: Array<{
    required?: boolean
    message: string
    trigger: 'blur'
    pattern?: RegExp
  }>
  description: Array<{
    required?: boolean
    message: string
    trigger: 'blur'
    max?: number
  }>
}

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入网站名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网站URL', trigger: 'blur' },
    {
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/,
      message: '请输入有效的URL',
      trigger: 'blur'
    }
  ],
  description: [
    { required: false, message: '请输入网站描述', trigger: 'blur' },
    { max: 50, message: '描述不能超过50个字符', trigger: 'blur' }
  ]
}

const formRef = ref<FormInstance>()

// 添加网站
const addWebsite = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      websites.value.push({
        name: newWebsite.name,
        url: newWebsite.url,
        description: newWebsite.description,
        icon: 'Link'
      })

      // 重置表单
      newWebsite.name = ''
      newWebsite.url = ''
      newWebsite.description = ''

      ElMessage({
        message: '网站添加成功',
        type: 'success'
      })
    }
  })
}

// 访问网站
const visitWebsite = (url: string): void => {
  // 确保 window.api 存在
  if (window.api && typeof window.api.openExternalUrl === 'function') {
    window.api.openExternalUrl(url)
  } else {
    // 降级处理：如果 API 不可用，尝试使用标准方法打开
    window.open(url, '_blank')
  }
}
</script>

<style scoped>
.common-websites-container {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.websites-header {
  padding: 20px 20px 0;
  background-color: #fff;
  z-index: 1;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.websites-scrollable-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  margin-top: 20px;
}

.website-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
  height: 150px;
  display: flex;
  flex-direction: column;
}

.website-card:hover {
  transform: translateY(-5px);
}

.website-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.website-info {
  text-align: center;
}

.website-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.website-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.add-website-section {
  margin-top: 20px;
  max-width: 500px;
  padding-bottom: 40px;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .common-websites-container {
    padding: 0;
  }

  .websites-header {
    padding: 10px 10px 0;
  }

  .websites-scrollable-container {
    padding: 0 10px 10px;
  }

  .website-card {
    height: auto;
    min-height: 120px;
  }
}
</style>

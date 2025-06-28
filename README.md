# Make Easy 桌面工具集

![AI Generated](https://img.shields.io/badge/AI%20Generated-blue?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-409EFF?style=for-the-badge&logo=element&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

一个基于 Electron、Vue 3、TypeScript 和 Element Plus 构建的现代桌面应用程序，提供实用的日常工具集。

> **特别说明**: 本项目采用 AI 辅助开发方法构建，展示了人工智能在软件工程中的创新应用。通过 AI 与人类开发者的协作，我们实现了高效率的代码生成、问题解决和功能实现，同时保持了代码的可读性、可维护性和高质量标准。这种开发模式代表了软件工程的未来趋势，结合了 AI 的效率与人类的创造力。

## 功能特点

- **待办事项管理**
  - 创建、编辑和删除任务，支持富文本描述
  - 设置任务优先级和截止日期
  - 标记任务完成状态，支持批量操作
  - 多维度筛选：按状态（全部/进行中/已完成）、优先级和日期
  - 智能排序功能，按截止日期、优先级或创建时间排序
  - 响应式设计，支持滚动查看大量任务
  - 任务完成时的视觉反馈，提升用户体验

- **常用网站导航**
  - 智能分类的预设常用网站快捷访问
  - 自定义添加网站，支持名称、URL和描述（可选）
  - 美观的卡片式布局，支持悬停动画效果
  - 一键在默认浏览器中打开网站
  - 支持滚动查看大量网站卡片
  - 响应式网格布局，自动适应不同屏幕尺寸

- **文件哈希计算器**
  - 支持多种哈希算法：MD5、SHA1、SHA256、SHA512
  - 单文件哈希计算与批量目录处理
  - 文件拖拽上传支持
  - 哈希值一键复制到剪贴板
  - 智能文件重命名功能（自动将哈希值添加到文件名）
  - 实时计算结果展示
  - 多文件批处理结果表格展示

- **用户界面与体验**
  - 现代化UI设计，基于Element Plus组件库
  - 明暗主题支持（计划中）
  - 流畅的动画和过渡效果
  - 直观的操作逻辑，降低学习成本
  - 响应式设计，适配不同屏幕尺寸

- **跨平台支持**
  - 完全兼容Windows、macOS和Linux系统
  - 统一的用户界面和体验
  - 针对不同操作系统优化的构建配置
  - 原生系统集成（文件选择、目录浏览等）

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **构建工具**: Vite
- **桌面框架**: Electron
- **状态管理**: Vue Reactive API
- **包管理器**: pnpm

## 项目设置

### 安装依赖

```bash
$ pnpm install
```

### 开发模式

```bash
$ pnpm dev
```

### 构建应用

```bash
# Windows 平台
$ pnpm build:win

# macOS 平台
$ pnpm build:mac

# Linux 平台
$ pnpm build:linux
```

## 项目结构

```
electron-vite-elementplus/
├── electron/              # Electron 主进程代码
├── src/
│   ├── main/              # 主进程源代码
│   ├── preload/           # 预加载脚本
│   └── renderer/          # 渲染进程源代码 (Vue)
│       ├── src/
│       │   ├── assets/    # 静态资源
│       │   ├── components/# Vue 组件
│       │   └── App.vue    # 主应用组件
├── electron-builder.yml   # Electron Builder 配置
└── package.json          # 项目配置
```

## 贡献指南

欢迎对本项目进行贡献！以下是贡献流程：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 未来计划

- [ ] 添加更多实用工具
- [ ] 优化性能和用户体验

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件


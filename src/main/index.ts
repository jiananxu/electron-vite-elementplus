import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join, dirname } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readdir, rename } from 'fs/promises'
import { createReadStream, existsSync } from 'fs'
import { createHash } from 'crypto'
import { cpus } from 'os'
import { pipeline } from 'stream/promises'

// 缓存已计算的哈希值
const hashCache = new Map<string, Record<string, string>>()

// 工具函数：将算法名称转换为 Node.js crypto 模块支持的格式
function getHashType(algorithm: string): string {
  switch (algorithm.toUpperCase()) {
    case 'SHA1':
      return 'sha1'
    case 'SHA256':
      return 'sha256'
    case 'SHA512':
      return 'sha512'
    case 'MD5':
      return 'md5'
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`)
  }
}

// 工具函数：计算文件的哈希值
async function calculateFileHashes(filePath: string, algorithms: string[]): Promise<Record<string, string>> {
  // 生成缓存键
  const cacheKey = `${filePath}:${algorithms.sort().join(',')}`

  // 检查缓存
  if (hashCache.has(cacheKey)) {
    return hashCache.get(cacheKey)!
  }

  const results: Record<string, string> = {}
  const hashes = algorithms.map(algo => ({
    type: algo,
    hash: createHash(getHashType(algo))
  }))

  // 使用流式处理
  const fileStream = createReadStream(filePath, { highWaterMark: 1024 * 1024 * 500 }) // 500MB chunks

  // 使用pipeline处理流
  await pipeline(
    fileStream,
    async function* (source) {
      for await (const chunk of source) {
        // 对每个chunk同时更新所有hash
        hashes.forEach(({ hash }) => hash.update(chunk))
        yield chunk
      }
    }
  )

  // 计算最终的哈希值
  hashes.forEach(({ type, hash }) => {
    results[type] = hash.digest('hex')
  })

  // 存入缓存
  hashCache.set(cacheKey, results)

  // 缓存大小控制
  if (hashCache.size > 1000) {
    const firstKey: any = hashCache.keys().next().value
    hashCache.delete(firstKey)
  }

  return results
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 处理文件哈希计算
  ipcMain.handle('calculate-file-hash', async (_, filePath, algorithms) => {
    try {
      const results = await calculateFileHashes(filePath, algorithms)
      return { success: true, results }
    } catch (error) {
      return { success: false, error }
    }
  })

  // 批量处理文件哈希计算
  ipcMain.handle('calculate-batch-hashes', async (_, filePaths, algorithms) => {
    try {
      const batchSize = Math.max(1, Math.min(cpus().length * 2, 8)) // 根据CPU核心数确定批量大小，最大8个
      const results: any = []

      // 分批处理文件
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize)
        const batchPromises = batch.map(async (filePath) => {
          try {
            const hashResults = await calculateFileHashes(filePath, algorithms)
            return { filePath, success: true, results: hashResults }
          } catch (error) {
            return { filePath, success: false, error }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      return { success: true, results }
    } catch (error) {
      return { success: false, error }
    }
  })

  // 处理目录扫描
  ipcMain.handle('scan-directory', async (_, dirPath) => {
    try {
      // 读取目录内容
      const files = await readdir(dirPath)
      // 处理所有文件
      const allFiles = files.map((fileName) => join(dirPath, fileName))
      return {
        success: true,
        files: allFiles
      }
    } catch (error) {
      return {
        success: false,
        error: error
      }
    }
  })

  // 选择目录对话框
  ipcMain.handle('select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return undefined
      }

      return result.filePaths[0]
    } catch (error) {
      console.error('选择目录出错:', error)
      return undefined
    }
  })

  // 处理文件上传并计算哈希
  ipcMain.handle('upload-and-calculate-hash', async (_, algorithms) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: false,
          error: 'File selection canceled'
        }
      }

      const filePath = result.filePaths[0]
      const results = await calculateFileHashes(filePath, algorithms)

      return {
        success: true,
        filePath,
        fileName: filePath.split(/[/\\]/).pop(),
        results
      }
    } catch (error) {
      return {
        success: false,
        error: error
      }
    }
  })

  // 处理文件重命名
  ipcMain.handle('rename-file', async (_, oldPath, newName) => {
    try {
      // 确保文件存在
      if (!existsSync(oldPath)) {
        return {
          success: false,
          error: 'File does not exist'
        }
      }

      // 获取文件所在目录
      const directory = dirname(oldPath)

      // 创建新文件的完整路径
      const newPath = join(directory, newName)

      // 检查新文件名是否已存在
      if (existsSync(newPath)) {
        return {
          success: false,
          error: 'A file with this name already exists'
        }
      }

      // 执行重命名操作
      await rename(oldPath, newPath)

      return {
        success: true,
        newPath
      }
    } catch (error) {
      console.error('重命名文件出错:', error)
      return {
        success: false,
        error: error || 'Failed to rename file'
      }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

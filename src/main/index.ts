import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

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
function calculateFileHashes(filePath: string, algorithms: string[]): Record<string, string> {
  const results: Record<string, string> = {}
  const fileBuffer = readFileSync(filePath)

  for (const algorithm of algorithms) {
    const hashType = getHashType(algorithm)
    const hash = createHash(hashType).update(fileBuffer).digest('hex')
    results[algorithm] = hash
  }

  return results
}

// 工具函数：包装错误处理
function wrapWithErrorHandling<T>(fn: () => T): { success: boolean; results?: T; error?: any } {
  try {
    const results = fn()
    return { success: true, results }
  } catch (error) {
    return { success: false, error }
  }
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
    return wrapWithErrorHandling(() => {
      const results = calculateFileHashes(filePath, algorithms)
      return results
    })
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
      const results = calculateFileHashes(filePath, algorithms)

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

  // 处理从拖拽文件计算哈希
  ipcMain.handle('calculate-hash-from-file', async (_, file, algorithms) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: `请选择拖拽的文件: ${file.name}`,
        buttonLabel: '选择此文件'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: false,
          error: 'File selection canceled'
        }
      }

      const filePath = result.filePaths[0]
      const results = calculateFileHashes(filePath, algorithms)

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

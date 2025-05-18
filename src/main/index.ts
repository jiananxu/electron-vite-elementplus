import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

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
      const results = {}

      // 使用 Node.js 的原生 crypto 模块计算哈希
      for (const algorithm of algorithms) {
        let hashType: string

        // 将算法名称转换为 Node.js crypto 模块支持的格式
        switch (algorithm.toUpperCase()) {
          case 'SHA1':
            hashType = 'sha1'
            break
          case 'SHA256':
            hashType = 'sha256'
            break
          case 'SHA512':
            hashType = 'sha512'
            break
          case 'MD5':
            hashType = 'md5'
            break
          default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`)
        }

        // 使用同步方法读取文件并计算哈希
        const fileBuffer = readFileSync(filePath)
        const hash = createHash(hashType).update(fileBuffer).digest('hex')
        results[algorithm] = hash
      }

      return {
        success: true,
        results
      }
    } catch (error) {
      return {
        success: false,
        error: error
      }
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
      const results = {}

      // 使用 Node.js 的原生 crypto 模块计算哈希
      for (const algorithm of algorithms) {
        let hashType: string

        // 将算法名称转换为 Node.js crypto 模块支持的格式
        switch (algorithm.toUpperCase()) {
          case 'SHA1':
            hashType = 'sha1'
            break
          case 'SHA256':
            hashType = 'sha256'
            break
          case 'SHA512':
            hashType = 'sha512'
            break
          case 'MD5':
            hashType = 'md5'
            break
          default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`)
        }

        // 读取文件并计算哈希
        const fileBuffer = readFileSync(filePath)
        const hash = createHash(hashType).update(fileBuffer).digest('hex')
        results[algorithm] = hash
      }

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
      // 由于 Electron 的安全限制，我们不能直接从渲染进程访问拖拽文件的路径
      // 这里我们需要通过临时文件或其他方式处理
      // 在这个实现中，我们将使用渲染进程提供的文件名，并通过文件选择对话框让用户选择实际文件

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
      const results = {}

      // 使用 Node.js 的原生 crypto 模块计算哈希
      for (const algorithm of algorithms) {
        let hashType: string

        // 将算法名称转换为 Node.js crypto 模块支持的格式
        switch (algorithm.toUpperCase()) {
          case 'SHA1':
            hashType = 'sha1'
            break
          case 'SHA256':
            hashType = 'sha256'
            break
          case 'SHA512':
            hashType = 'sha512'
            break
          case 'MD5':
            hashType = 'md5'
            break
          default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`)
        }

        // 读取文件并计算哈希
        const fileBuffer = readFileSync(filePath)
        const hash = createHash(hashType).update(fileBuffer).digest('hex')
        results[algorithm] = hash
      }

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

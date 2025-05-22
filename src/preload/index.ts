import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  calculateHash: (filePath: string, algorithms: string[]) => {
    return ipcRenderer.invoke('calculate-file-hash', filePath, algorithms)
  },
  calculateBatchHashes: (filePaths: string[], algorithms: string[]) => {
    return ipcRenderer.invoke('calculate-batch-hashes', filePaths, algorithms)
  },
  scanDirectory: (dirPath: string) => {
    return ipcRenderer.invoke('scan-directory', dirPath)
  },
  selectDirectory: () => {
    return ipcRenderer.invoke('select-directory')
  },
  uploadAndCalculateHash: (algorithms: string[]) => {
    return ipcRenderer.invoke('upload-and-calculate-hash', algorithms)
  },
  calculateHashFromFile: (file: File, algorithms: string[]) => {
    return ipcRenderer.invoke('calculate-hash-from-file', file, algorithms)
  },
  renameFile: (oldPath: string, newName: string) => {
    return ipcRenderer.invoke('rename-file', oldPath, newName)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

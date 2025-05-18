import { ElectronAPI } from '@electron-toolkit/preload'

interface HashResult {
  success: boolean
  results?: Record<string, string>
  error?: string
  filePath?: string
  fileName?: string
}

interface ScanResult {
  success: boolean
  files?: string[]
  error?: string
}

interface API {
  calculateHash: (filePath: string, algorithms: string[]) => Promise<HashResult>
  scanDirectory: (dirPath: string) => Promise<ScanResult>
  selectDirectory: () => Promise<string | undefined>
  uploadAndCalculateHash: (algorithms: string[]) => Promise<HashResult>
  calculateHashFromFile: (file: File, algorithms: string[]) => Promise<HashResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}

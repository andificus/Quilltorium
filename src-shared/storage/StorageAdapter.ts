/**
 * StorageAdapter — the contract every platform must fulfill.
 *
 * This is the ONLY way the app reads and writes files.
 * No other file in the codebase may import Node.js 'fs' directly.
 *
 * Current implementations:
 *   - ElectronAdapter.ts (Windows desktop, Node.js fs)
 *
 * Future implementations:
 *   - WebAdapter.ts (browser File System Access API)
 *   - CapacitorAdapter.ts (mobile, Capacitor Filesystem plugin)
 */
export interface StorageAdapter {
  /** Read a file's full text content */
  readFile(path: string): Promise<string>

  /** Write text content to a file, creating it if it does not exist */
  writeFile(path: string, content: string): Promise<void>

  /** List all file paths in a directory (non-recursive) */
  listFiles(directory: string): Promise<string[]>

  /** Delete a file */
  deleteFile(path: string): Promise<void>

  /** Check whether a file or directory exists */
  exists(path: string): Promise<boolean>

  /** Create a directory and any missing parent directories */
  createDirectory(path: string): Promise<void>
}
import fs from 'fs/promises'
import path from 'path'
import type { StorageAdapter } from './StorageAdapter'

/**
 * ElectronAdapter — implements StorageAdapter using Node.js fs/promises.
 *
 * THIS IS THE ONLY FILE IN THE CODEBASE ALLOWED TO IMPORT 'fs'.
 * All file I/O in the app must go through this adapter via the StorageAdapter interface.
 */
export class ElectronAdapter implements StorageAdapter {
  /**
   * Read a file's full text content.
   * @param filePath - Absolute path to the file
   * @returns The file contents as a UTF-8 string
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      throw new Error(`ElectronAdapter.readFile failed for "${filePath}": ${error}`)
    }
  }

  /**
   * Write text content to a file, creating it if it does not exist.
   * @param filePath - Absolute path to the file
   * @param content - UTF-8 string content to write
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
    } catch (error) {
      throw new Error(`ElectronAdapter.writeFile failed for "${filePath}": ${error}`)
    }
  }

  /**
   * List all file paths in a directory (non-recursive).
   * @param dirPath - Absolute path to the directory
   * @returns Array of absolute file paths
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter(entry => entry.isFile())
        .map(entry => path.join(dirPath, entry.name))
    } catch (error) {
      throw new Error(`ElectronAdapter.listFiles failed for "${dirPath}": ${error}`)
    }
  }

  /**
   * Delete a file.
   * @param filePath - Absolute path to the file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      throw new Error(`ElectronAdapter.deleteFile failed for "${filePath}": ${error}`)
    }
  }

  /**
   * Check whether a file or directory exists.
   * @param filePath - Absolute path to check
   * @returns True if the path exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Create a directory and any missing parent directories.
   * @param dirPath - Absolute path of the directory to create
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      throw new Error(`ElectronAdapter.createDirectory failed for "${dirPath}": ${error}`)
    }
  }
}
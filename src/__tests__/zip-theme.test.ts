import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sdk from '../sdk.js'
import * as validation from '../validation.js'
import zip_theme from '../zip-theme.js'

// Create a mock for archiver
const archiverMock = vi.hoisted(() => ({
  pipe: vi.fn(),
  append: vi.fn(),
  pointer: vi.fn(() => 1024),
  finalize: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
}))

// Mock external modules
vi.mock('archiver', () => ({
  default: vi.fn(() => archiverMock),
}))

// Completely mock getVersionBump module
vi.mock('../getVersionBump.js', () => ({
  getVersionBump: () => Promise.resolve({ releaseType: 'patch', reason: 'Minor changes' }),
}))

// Mock dependencies
vi.spyOn(validation, 'validateTheme').mockResolvedValue('Theme validated')

// Stub sdk values
sdk.MAX_ZIP_FILE_SIZE_50MB = 50 * 1024 * 1024
sdk.root_allowed_files = ['index.js']
sdk.structure = {
  root: ['assets'],
  assets: [],
  templates: [],
  common: [],
  modules: [],
  locals: [],
}

describe('zip_theme', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks()

    // Make sure validation.validateTheme mock is restored
    vi.spyOn(validation, 'validateTheme').mockResolvedValue('Theme validated')

    // Set up directory mocks with appropriate files based on path
    vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath) => {

      if (dirPath === 'build/path') {
        return ['assets', 'index.html', 'style.css'] as any
      }
      // For other directories
      return ['index.html', 'style.css'] as any
    })

    // Mock fs.createWriteStream to simulate 'finish' event
    vi.spyOn(fs, 'createWriteStream').mockImplementation((_path) => {
      return {
        on: (event: string, cb: () => void) => {
          if (event === 'finish')
            cb()
        },
      } as any
    })

    // Add necessary fs mocks
    vi.spyOn(fs, 'statSync').mockImplementation((filePath) => {
      return {
        isDirectory: () => filePath.toString().endsWith('assets'),
        isFile: () => !filePath.toString().endsWith('assets'),
        size: 1024,
      } as any
    })

    vi.spyOn(fs, 'lstatSync').mockImplementation((filePath) => {
      return {
        isDirectory: () => filePath.toString().endsWith('assets'),
        isFile: () => !filePath.toString().endsWith('assets'),
        size: 1024,
      } as any
    })

    // Mock fs.existsSync to always return true
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    // Mock fs.createReadStream
    vi.spyOn(fs, 'createReadStream').mockReturnValue({} as any)
  })

  it('should create zip and return version bump recommendation', async () => {
    const build_name = 'theme'
    const build_path = `${process.cwd()}build/path`

    const result = await zip_theme(build_name, build_path)
    expect(result).toEqual({ releaseType: 'patch', reason: 'Minor changes' })

    // Verify validateTheme was called with the correct path
    expect(validation.validateTheme).toHaveBeenCalledWith(build_path)

    // Use the reference to the mock we created at the top
    expect(archiverMock.finalize).toHaveBeenCalled()
  })

  it('should throw error when theme validation fails', async () => {
    // Mock validation to throw an error
    const validationError = new Error('Invalid theme structure')
    vi.spyOn(validation, 'validateTheme').mockRejectedValue(validationError)

    await expect(zip_theme('theme', 'build/path')).rejects.toThrow('Invalid theme structure')
  })

  it('should throw error when non-Error is thrown during validation', async () => {
    // Mock validation to throw a non-Error
    vi.spyOn(validation, 'validateTheme').mockRejectedValue('String error')

    await expect(zip_theme('theme', 'build/path')).rejects.toThrow('String error')
  })

  it('should handle large zip files and remove them', async () => {
    // Mock archiver pointer to return size above MAX_ZIP_FILE_SIZE_50MB
    archiverMock.pointer.mockReturnValue(sdk.MAX_ZIP_FILE_SIZE_50MB + 1)

    // Mock fs.rmSync
    const rmSyncMock = vi.spyOn(fs, 'rmSync').mockImplementation(() => {})

    const build_name = 'theme'
    const build_path = 'build/path'

    await zip_theme(build_name, build_path)

    // Verify rmSync was called to remove oversized zip file
    expect(rmSyncMock).toHaveBeenCalledWith(`${process.cwd()}/${build_path}/${build_name}.zip`)
  })
})

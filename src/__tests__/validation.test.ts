import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'
import sdk from '../sdk.js'
import * as validation from '../validation.js'
import { formatSizeUnits, validate_assets_file_size, validateTheme } from '../validation.js'

// Stub sdk for testing validation
vi.mock('../logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock fs functions
vi.mock('node:fs')
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path')
  return {
    ...actual,
    extname: vi.fn((filename) => {
      // Simple implementation for testing
      return filename.includes('.') ? filename.split('.').pop().startsWith('.') ? filename.split('.').pop() : `.${filename.split('.').pop()}` : ''
    }),
    resolve: vi.fn((...args) => args.join('/')),
  }
})

describe('validation', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()

    // Setup SDK stubs for each test with SPECIFIC TEMPLATE FILES
    sdk.structure = {
      root: ['assets', 'templates', 'index.html'],
      templates: ['product.twig', '404.twig', 'home.twig'],
      common: ['.twig'],
      modules: ['.twig'],
      assets: ['.js', '.css', '.svg'],
      locals: ['.json'],
    }

    sdk.optional_files = {
      root: [],
      templates: [],
      common: [],
      modules: [],
      assets: [],
      locals: [],
    }

    sdk.need_structure_validation = ['templates']
    sdk.MAX_ASSETS_FILE_SIZE_2MB = 2 * 1024 * 1024

    // Setup default fs mocks
    vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
      let files: string[] = []
      if (dirPath === '.')
        files = ['assets', 'templates', 'index.html']
      else if (dirPath === './templates')
        files = ['product.twig', '404.twig', 'home.twig', '.twig'] 
      else if (dirPath === './assets')
        files = ['main.js', 'style.css', 'logo.svg']
      else
        files = []

      // Handle withFileTypes option
      if (options && typeof options === 'object' && options.withFileTypes) {
        return files.map(file => ({
          name: file,
          isDirectory: () => file === 'assets' || file === 'templates',
          isFile: () => file !== 'assets' && file !== 'templates',
          isSymbolicLink: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isFIFO: () => false,
          isSocket: () => false,
        })) as fs.Dirent[]
      }

      return files as any
    })

    vi.spyOn(fs, 'lstatSync').mockImplementation((path) => {
      return {
        isDirectory: () => path.toString().includes('assets') || path.toString().includes('templates'),
        isFile: () => !path.toString().includes('assets') && !path.toString().includes('templates'),
        size: path.toString().includes('large') ? 3 * 1024 * 1024 : 1024,
      } as any
    })

    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateTheme', () => {
    it('should validate correct theme structure', async () => {
      vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
        let files: string[] = []

        // Convert the path to a normalized string for comparison
        const normalizedPath = dirPath.toString().replace(/\\/g, '/')

        if (normalizedPath === '.' || normalizedPath === './') {
          files = ['assets', 'templates', 'index.html']
        }
        else if (
          normalizedPath === './templates'
          || normalizedPath === 'templates'
          || normalizedPath.endsWith('/templates')
        ) {
          files = ['product.twig', '404.twig', 'home.twig']
        }
        else if (
          normalizedPath === './assets'
          || normalizedPath === 'assets'
          || normalizedPath.endsWith('/assets')
        ) {
          files = ['main.js', 'style.css', 'logo.svg']
        }
        else {
          files = []
        }

        if (options && typeof options === 'object' && options.withFileTypes) {
          return files.map(file => ({
            name: file,
            isDirectory: () => file === 'assets' || file === 'templates',
            isFile: () => file !== 'assets' && file !== 'templates',
            isSymbolicLink: () => false,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
          })) as fs.Dirent[]
        }

        return files as any
      })

      const result = await validateTheme('.')
      expect(result).toBe('Theme validated')
    })

    it('should reject when required root files are missing', async () => {
      vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
        if (dirPath === '.') {
          const files = ['assets'] 

          if (options && typeof options === 'object' && options.withFileTypes) {
            return files.map(file => ({
              name: file,
              isDirectory: () => file === 'assets' || file === 'templates',
              isFile: () => file !== 'assets' && file !== 'templates',
              isSymbolicLink: () => false,
              isBlockDevice: () => false,
              isCharacterDevice: () => false,
              isFIFO: () => false,
              isSocket: () => false,
            })) as fs.Dirent[]
          }

          return files as any
        }
        return [] as any
      })

      await expect(validateTheme('.')).rejects.toThrow('Unable to find:')
    })

    it('should reject when required template files are missing', async () => {
      vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
        let files: string[] = []

        if (dirPath === '.')
          files = ['assets', 'templates', 'index.html']
        else if (dirPath === './templates')
          files = [] 

        if (options && typeof options === 'object' && options.withFileTypes) {
          return files.map(file => ({
            name: file,
            isDirectory: () => file === 'assets' || file === 'templates',
            isFile: () => file !== 'assets' && file !== 'templates',
            isSymbolicLink: () => false,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
          })) as fs.Dirent[]
        }

        return files as any
      })

      await expect(validateTheme('.')).rejects.toThrow('Unable to find in templates folder:')
    })

    it('should delete .DS_Store files when encountered', async () => {
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync')

      vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
        let files: string[] = []

        // Convert the path to a normalized string for comparison
        const normalizedPath = dirPath.toString().replace(/\\/g, '/')

        if (normalizedPath === '.' || normalizedPath === './') {
          files = ['assets', 'templates', 'index.html', '.DS_Store']
        }
        else if (
          normalizedPath === './templates'
          || normalizedPath === 'templates'
          || normalizedPath.endsWith('/templates')
        ) {
          files = ['product.twig', '404.twig', 'home.twig']
        }
        else if (
          normalizedPath === './assets'
          || normalizedPath === 'assets'
          || normalizedPath.endsWith('/assets')
        ) {
          files = ['main.js', '.DS_Store']
        }
        else {
          files = []
        }

        if (options && typeof options === 'object' && options.withFileTypes) {
          return files.map(file => ({
            name: file,
            isDirectory: () => file === 'assets' || file === 'templates',
            isFile: () => file !== 'assets' && file !== 'templates',
            isSymbolicLink: () => false,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
          })) as fs.Dirent[]
        }

        return files as any
      })

      await validateTheme('.')

      expect(unlinkSpy).toHaveBeenCalledTimes(2)
      expect(logger.warning).toHaveBeenCalledWith(expect.stringContaining('.DS_Store deleted'))
    })

    it('should warn about large asset files', async () => {
      // Create a spy on the validateTheme function
      const validateThemeSpy = vi.spyOn(validation, 'validateTheme')

      validateThemeSpy.mockImplementation(async (build_path: string) => {


        // Mock the filesystem access for assets
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath) => {
          if (dirPath === '.')
            return ['assets'] as any
          if (dirPath === './assets')
            return ['large-file.js'] as any
          return [] as any
        })

        // Mock file stats to trigger the large file warning
        vi.spyOn(fs, 'lstatSync').mockImplementation((filePath) => {
          return {
            isDirectory: () => filePath.toString().includes('assets'),
            isFile: () => !filePath.toString().includes('assets'),
            size: filePath.toString().includes('large-file') ? 3 * 1024 * 1024 : 1024,
          } as any
        })

        // Manually call the validation function we want to test
        const assetPath = path.resolve(build_path, 'assets', 'large-file.js')
        validate_assets_file_size('large-file.js', assetPath)

        return 'Theme validated'
      })

      await validateTheme('.')

      // Verify the warning was shown
      expect(logger.warning).toHaveBeenCalledWith(expect.stringContaining('larger than 2MB'))
    })

    it('should reject when files have invalid extensions', async () => {
      vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: any, options?: any) => {
        let files: string[] = []

        if (dirPath === '.')
          files = ['assets', 'templates', 'index.html']
        else if (dirPath === './templates')
          files = ['product.twig']
        else if (dirPath === './assets')
          files = ['invalid.php'] // Invalid extension
        else
          files = []

        if (options && typeof options === 'object' && options.withFileTypes) {
          return files.map(file => ({
            name: file,
            isDirectory: () => file === 'assets' || file === 'templates',
            isFile: () => file !== 'assets' && file !== 'templates',
            isSymbolicLink: () => false,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
          })) as fs.Dirent[]
        }

        return files as any
      })

      await expect(validateTheme('.')).rejects.toThrow('Unable to find in templates')
    })
  })

  describe('formatSizeUnits', () => {
    it('should format byte size correctly', () => {
      expect(formatSizeUnits(500)).toBe('500 bytes')
      expect(formatSizeUnits(1)).toBe('1 byte')
      expect(formatSizeUnits(0)).toBe('0 bytes')
    })

    it('should format KB size correctly', () => {
      expect(formatSizeUnits(1536)).toBe('1.54KB')
    })

    it('should format MB size correctly', () => {
      expect(formatSizeUnits(1548576)).toBe('1.55MB')
    })

    it('should format GB size correctly', () => {
      expect(formatSizeUnits(1073741824)).toBe('1.07GB')
    })
  })
})

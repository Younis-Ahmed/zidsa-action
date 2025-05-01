import * as fs from 'node:fs'
import process from 'node:process'
import FormData from 'form-data'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'
import updateTheme from '../update.js'
import zip_theme from '../zip-theme.js'

const sendMock = vi.fn()

// Mock dependencies
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('node:fs')
  return {
    ...actual,
    createReadStream: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
  }
})

vi.mock('node:process', () => ({
  default: {
    chdir: vi.fn(),
  },
}))

vi.mock('form-data', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      append: vi.fn(),
    })),
  }
})

vi.mock('../api.js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      reset: vi.fn().mockReturnThis(),
      addBaseUrl: vi.fn().mockReturnThis(),
      addRoute: vi.fn().mockReturnThis(),
      addUserToken: vi.fn().mockReturnThis(),
      addFormData: vi.fn().mockReturnThis(),
      post: vi.fn().mockReturnThis(),
      send: sendMock,
    })),
  }
})

vi.mock('../logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('../zip-theme.js', () => {
  return {
    default: vi.fn(),
  }
})

describe('updateTheme', () => {
  const mockThemeId = 'theme-123'
  const mockThemePath = '/path/to/theme'
  const mockReleaseType = 'minor'
  const mockReason = 'Bug fixes and improvements'
  const mockApiResponse = { status: 'success' }

  let mockFileStream: { on: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(zip_theme).mockResolvedValue({
      releaseType: mockReleaseType,
      reason: mockReason,
    })

    vi.mocked(FormData).mockClear()

    // Create mockFileStream as a plain object with an .on method
    mockFileStream = { on: vi.fn() } as any

    // Set up fs mocks only once using vi.mocked
    vi.mocked(fs.createReadStream).mockReturnValue(mockFileStream as any)
    vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
      return path.toString() === '/path/to/theme' || path.toString() === '/path/to/theme/theme.zip'
    })

    sendMock.mockResolvedValue(mockApiResponse)

    vi.mocked(process.chdir).mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const setupAndRunUpdateTheme = async () => {
    return await updateTheme(mockThemeId, mockThemePath)
  }

  it('should handle file stream errors', async () => {
    const mockError = new Error('Zip file not found at: /path/to/theme/theme.zip')

    mockFileStream.on.mockImplementation((event: string, callback: any) => {
      if (event === 'error') {
        setTimeout(() => callback(mockError), 0)
      }
      return mockFileStream
    })

    await expect(setupAndRunUpdateTheme()).rejects.toThrowError(mockError)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Zip file not found at: /path/to/theme/theme.zip'),
    )
  })
})

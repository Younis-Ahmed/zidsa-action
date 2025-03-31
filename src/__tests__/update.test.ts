import fs from 'node:fs'
import process from 'node:process'
import FormData from 'form-data'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'
import updateTheme from '../update.js'
import zip_theme from '../zip-theme.js'

const sendMock = vi.fn()

// Mock dependencies
vi.mock('node:fs', () => ({
  default: {
    createReadStream: vi.fn(),
  },
}))

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

    mockFileStream = {
      on: vi.fn().mockImplementation((event: string, callback: any) => {
        if (event === 'open') {
          setTimeout(() => callback(), 0)
        }
        return mockFileStream
      }),
    }

    vi.mocked(fs.createReadStream).mockReturnValue(mockFileStream as any)

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
    const mockError = new Error('File stream error')

    mockFileStream.on.mockImplementation((event: string, callback: any) => {
      if (event === 'error') {
        setTimeout(() => callback(mockError), 0)
      }
      return mockFileStream
    })

    await expect(setupAndRunUpdateTheme()).rejects.toThrow(mockError)
    expect(logger.error).toHaveBeenCalledWith('File stream error')
  })
})
